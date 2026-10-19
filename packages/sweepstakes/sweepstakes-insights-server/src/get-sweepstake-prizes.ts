'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { z } from 'zod';
import { sweepstakesPrizeSchema } from '@giveaway/sweepstakes-model/schemas';
import {
  PRIZE_WINNERS_INCLUDE_QUERY,
  toSweepstakesPrizes
} from '@giveaway/sweepstakes-model/prizes';
import { findTeamSweepstakes } from '@giveaway/sweepstakes-access/team-sweepstakes';

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
  .handler(async ({ input: { sweepstakesId, slug }, user, db }) => {
    const sweepstakes = await findTeamSweepstakes({
      db,
      userId: user.id,
      sweepstakesId,
      slug
    });

    const prizes = await db.prize.findMany({
      where: {
        sweepstakesId: sweepstakes.id
      },
      include: PRIZE_WINNERS_INCLUDE_QUERY
    });

    return toSweepstakesPrizes(prizes);
  });

export default getSweepstakesPrizes;
