import 'server-only';

import { ApplicationError } from '@giveaway/util-errors';
import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { findSweepstakesAccess } from './access';

export const getSweepstakesId = procedure()
  .authorization({ required: false })
  .input(z.object({ sweepstakesId: z.string() }))
  .output(z.string())
  .handler(async ({ db, input }) => {
    const sweepstakes = await findSweepstakesAccess({
      db,
      sweepstakesId: input.sweepstakesId
    });

    if (!sweepstakes) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `Sweepstakes with ID ${input.sweepstakesId} not found`
      });
    }

    return sweepstakes.id;
  });
