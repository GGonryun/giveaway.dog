'use server';

import z from 'zod';

import { procedure } from '@/lib/mrpc/procedures';
import { getSweepstakesCriteria } from '../criteria';
import { toDuplicatePrizeDraw, toUniquePrizeDraw } from '../selection';
import {
  getDrawsInfo,
  getEmptyPrizeSlots,
  getPrizeAllocations
} from '../slots';
import { getEligibleCompletions } from '../completions';

export const rollPrize = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      sweepstakesId: z.string(),
      slug: z.string(),
      prizeId: z.string()
    })
  )
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ input: { sweepstakesId, prizeId }, db, user }) => {
    const criteria = await getSweepstakesCriteria({
      db,
      sweepstakesId
    });

    const slots = await getEmptyPrizeSlots({
      db,
      sweepstakesId,
      prizeId
    });

    const draws = await getDrawsInfo({
      db,
      sweepstakesId
    });

    const completions = await getEligibleCompletions({
      db,
      user,
      sweepstakesId,
      criteria
    });

    const allocations = await getPrizeAllocations({
      db,
      sweepstakesId
    });

    const toPrizeDraw = criteria.allowMultipleWins
      ? toDuplicatePrizeDraw
      : toUniquePrizeDraw;

    await db.prizeDraw.createMany({
      data: toPrizeDraw({
        draws,
        slots,
        completions,
        criteria,
        allocations
      })
    });

    return { success: true };
  });
