'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { PARTICIPANT_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { z } from 'zod';
import { ApplicationError } from '@/lib/errors';
import { sweepstakesPrizeSchema } from '@/schemas/giveaway/schemas';
import {
  PRIZE_WINNER_INCLUDE_QUERY,
  toSweepstakesPrizes
} from '@/schemas/prizes';
import { SWEEPSTAKES_TASK_WHERE_QUERY } from '@/schemas/participants';

const getParticipantSweepstake = procedure()
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
      include: PRIZE_WINNER_INCLUDE_QUERY(sweepstakesId)
    });

    const totalTasks = await db.task.count({
      where: SWEEPSTAKES_TASK_WHERE_QUERY({
        sweepstakesId,
        slug,
        userId: user.id
      })
    });

    return toSweepstakesPrizes(prizes, totalTasks);
  });

export default getParticipantSweepstake;
