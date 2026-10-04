'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { findUserSweepstakesQuery } from '@giveaway/sweepstakes-access/shared';
import { ApplicationError } from '@giveaway/util-errors';
import { toSweepstakesInput } from '@giveaway/sweepstakes-model/input';
import {
  FORM_SWEEPSTAKES_PAYLOAD,
  sweepstakesInputSchema
} from '@giveaway/sweepstakes-model/db';

const getSweepstakesForm = procedure()
  .authorization({ required: true })
  .input(z.object({ id: z.string() }))
  .output(sweepstakesInputSchema)
  .handler(async ({ db, user, input }) => {
    const data = await db.sweepstakes.findUnique({
      where: findUserSweepstakesQuery({
        id: input.id,
        userId: user.id
      }),
      include: FORM_SWEEPSTAKES_PAYLOAD
    });

    if (!data) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `Sweepstakes with ID ${input.id} not found`
      });
    }

    const parsed = toSweepstakesInput(data);
    return {
      ...parsed,
      id: data.id,
      status: data.status
    };
  });

export default getSweepstakesForm;
