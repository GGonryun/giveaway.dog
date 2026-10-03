'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { PARTICIPANT_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { z } from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import { sweepstakesPrizeSchema } from '@/schemas/giveaway/schemas';
import {
  PRIZE_WINNERS_INCLUDE_QUERY,
  toSweepstakesPrizes
} from '@/schemas/prizes';

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
