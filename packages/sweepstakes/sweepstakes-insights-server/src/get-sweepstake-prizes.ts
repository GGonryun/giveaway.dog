'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { findUserSweepstakes } from '@giveaway/sweepstakes-access/shared';
import { TeamPermission } from '@giveaway/team-permissions';
import { TeamTier } from '@giveaway/db-model';
import { z } from 'zod';
import { sweepstakesPrizeSchema } from '@giveaway/sweepstakes-model/schemas';
import {
  PRIZE_WINNERS_INCLUDE_QUERY,
  toSweepstakesPrizes
} from '@giveaway/sweepstakes-model/prizes';

const getSweepstakesPrizes = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      sweepstakesId: z.string(),
      slug: z.string()
    })
  )
  .output(sweepstakesPrizeSchema.array())
  .handler(async ({ input: { sweepstakesId, slug }, db, user }) => {
    await findUserSweepstakes({
      db,
      user,
      id: sweepstakesId,
      slug,
      permission: TeamPermission.VIEW_SWEEPSTAKES,
      tier: TeamTier.FREE
    });

    const prizes = await db.prize.findMany({
      where: {
        sweepstakesId
      },
      include: PRIZE_WINNERS_INCLUDE_QUERY
    });

    return toSweepstakesPrizes(prizes);
  });

export default getSweepstakesPrizes;
