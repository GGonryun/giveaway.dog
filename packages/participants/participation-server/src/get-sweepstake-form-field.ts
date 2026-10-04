'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { z } from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import { sweepstakesFormFieldSchema } from '@giveaway/custom-fields-model/schemas';

export const getSweepstakesFormFields = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      sweepstakesId: z.string()
    })
  )
  .output(sweepstakesFormFieldSchema.array())
  .handler(async ({ input, db }) => {
    const sweepstakes = await db.sweepstakes.findFirst({
      where: {
        OR: [
          { id: input.sweepstakesId },
          { visibility: { slug: input.sweepstakesId } }
        ]
      },
      include: {
        team: true,
        audience: {
          include: {
            formFields: true
          }
        }
      }
    });
    if (!sweepstakes || !sweepstakes.team) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `Sweepstakes with ID ${input.sweepstakesId} not found`
      });
    }

    return (
      sweepstakes.audience?.formFields.map((field) => {
        const parse = sweepstakesFormFieldSchema.safeParse(field);
        if (!parse.success) {
          throw new ApplicationError({
            code: 'VALIDATION_ERROR',
            message: `Invalid form field data for field ID ${field.id}`,
            cause: parse.error
          });
        }
        return parse.data;
      }) ?? []
    );
  });
