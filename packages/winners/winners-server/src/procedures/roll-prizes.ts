'use server';

import z from 'zod';

import { procedure } from '@giveaway/rpc-server/procedures';
import { getSweepstakesCriteria } from '@giveaway/winners-model/criteria';
import { getEligibleCompletions } from '../completions';
import {
  getDrawsInfo,
  getEmptyPrizeSlots,
  getPrizeAllocations
} from '@giveaway/winners-model/slots';
import { toDuplicatePrizeDraw, toUniquePrizeDraw } from '../selection';

export const rollPrizes = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      sweepstakesId: z.string(),
      slug: z.string()
    })
  )
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ input: { sweepstakesId }, db, user }) => {
    const criteria = await getSweepstakesCriteria({
      db,
      sweepstakesId
    });

    const slots = await getEmptyPrizeSlots({
      db,
      sweepstakesId
    });

    const draws = await getDrawsInfo({
      db,
      sweepstakesId
    });

    const allocations = await getPrizeAllocations({
      db,
      sweepstakesId
    });

    const completions = await getEligibleCompletions({
      db,
      user,
      sweepstakesId,
      criteria
    });

    const toPrizeDraw = criteria.allowMultipleWins
      ? toDuplicatePrizeDraw
      : toUniquePrizeDraw;

    await db.prizeDraw.createMany({
      data: toPrizeDraw({
        draws,
        slots,
        criteria,
        completions,
        allocations
      })
    });

    return { success: true };
  });
