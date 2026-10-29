'use server';

import z from 'zod';

import { procedure } from '@giveaway/rpc-server/procedures';
import { findTeamSweepstakes } from '@giveaway/sweepstakes-access/team-sweepstakes';
import { assertNotCompleted } from '@giveaway/sweepstakes-access/completed';
import { TeamPermission } from '@giveaway/team-permissions';
import { assertSweepstakesEnded } from '../ended';
import { getSweepstakesCriteria } from '@giveaway/winners-model/criteria';
import { getEligibleCompletions } from '../completions';
import {
  getDrawsInfo,
  getEmptyPrizeSlots,
  getPrizeAllocations
} from '@giveaway/winners-model/slots';
import { toDuplicatePrizeDraw, toUniquePrizeDraw } from '../selection';
import { withLockedPrizes } from '../prize-lock';

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
  .invalidate(async ({ input }) => [
    `sweepstakes-${input.sweepstakesId}`,
    'winners-leaderboard'
  ])
  .handler(async ({ input: { sweepstakesId, slug }, db, user }) => {
    const sweepstakes = await findTeamSweepstakes({
      db,
      userId: user.id,
      sweepstakesId,
      slug,
      permission: TeamPermission.UPDATE_SWEEPSTAKES
    });

    assertNotCompleted(sweepstakes);

    await assertSweepstakesEnded({ db, sweepstakesId });

    const criteria = await getSweepstakesCriteria({
      db,
      sweepstakesId
    });

    const toPrizeDraw = criteria.allowMultipleWins
      ? toDuplicatePrizeDraw
      : toUniquePrizeDraw;

    await withLockedPrizes({
      db,
      sweepstakesId,
      run: async (tx) => {
        const slots = await getEmptyPrizeSlots({
          db: tx,
          sweepstakesId
        });

        const draws = await getDrawsInfo({
          db: tx,
          sweepstakesId
        });

        const allocations = await getPrizeAllocations({
          db: tx,
          sweepstakesId
        });

        const completions = await getEligibleCompletions({
          db: tx,
          user,
          sweepstakesId,
          criteria
        });

        await tx.prizeDraw.createMany({
          data: toPrizeDraw({
            draws,
            slots,
            criteria,
            completions,
            allocations
          })
        });
      }
    });

    return { success: true };
  });
