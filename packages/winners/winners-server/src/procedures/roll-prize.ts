'use server';

import z from 'zod';

import { procedure } from '@giveaway/rpc-server/procedures';
import { findTeamSweepstakes } from '@giveaway/sweepstakes-access/team-sweepstakes';
import { TeamPermission } from '@giveaway/team-permissions';
import { assertSweepstakesEnded } from '../ended';
import { getSweepstakesCriteria } from '@giveaway/winners-model/criteria';
import { toDuplicatePrizeDraw, toUniquePrizeDraw } from '../selection';
import {
  getDrawsInfo,
  getEmptyPrizeSlots,
  getPrizeAllocations
} from '@giveaway/winners-model/slots';
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
  .handler(async ({ input: { sweepstakesId, slug, prizeId }, db, user }) => {
    await findTeamSweepstakes({
      db,
      userId: user.id,
      sweepstakesId,
      slug,
      permission: TeamPermission.UPDATE_SWEEPSTAKES
    });

    await assertSweepstakesEnded({ db, sweepstakesId });

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
