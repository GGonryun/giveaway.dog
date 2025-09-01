'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { findUserSweepstakesQuery } from './shared';
import { ApplicationError } from '@/lib/errors';
import { toSweepstakesInput } from '@/schemas/giveaway/input';
import {
  FULL_SWEEPSTAKES_PAYLOAD,
  sweepstakesInputSchema
} from '@/schemas/giveaway/db';

const getSweepstakesForm = procedure
  .authorization({ required: true })
  .input(z.object({ id: z.string() }))
  .output(sweepstakesInputSchema)
  .handler(async ({ db, user, input }) => {
    const data = await db.sweepstakes.findUnique({
      where: findUserSweepstakesQuery({
        id: input.id,
        userId: user.id
      }),
      include: FULL_SWEEPSTAKES_PAYLOAD
    });

    if (!data) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `Sweepstakes with ID ${input.id} not found`
      });
    }

    const parsed = toSweepstakesInput(data);
    return {
      id: data.id,
      ...parsed
    };
  });

export default getSweepstakesForm;
