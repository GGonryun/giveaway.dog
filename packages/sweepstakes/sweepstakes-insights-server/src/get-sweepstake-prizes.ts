'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { PARTICIPANT_SWEEPSTAKES_PAYLOAD } from '@giveaway/sweepstakes-model/db';
import { z } from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import { sweepstakesPrizeSchema } from '@giveaway/sweepstakes-model/schemas';
import {
  PRIZE_WINNERS_INCLUDE_QUERY,
  toSweepstakesPrizes
} from '@giveaway/sweepstakes-model/prizes';

const getSweepstakesPrizes = procedure(
  'sweepstakes-insights-server/getSweepstakesPrizes'
)
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
  .handler(async ({ input: { sweepstakesId, slug }, db }) => {
    const sweepstakes = await db.sweepstakes.findUnique({
      where: {
        id: sweepstakesId,
        team: {
          slug: slug
        }
      },
      include: PARTICIPANT_SWEEPSTAKES_PAYLOAD
    });

    if (!sweepstakes || !sweepstakes.team) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `Sweepstakes with ID ${sweepstakesId} not found`
      });
    }

    const prizes = await db.prize.findMany({
      where: {
        sweepstakesId
      },
      include: PRIZE_WINNERS_INCLUDE_QUERY
    });

    return toSweepstakesPrizes(prizes);
  });

export default getSweepstakesPrizes;
