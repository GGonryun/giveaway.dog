'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { PARTICIPANT_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { z } from 'zod';
import { ApplicationError } from '@/lib/errors';
import { toSweepstakesInput } from '@/schemas/giveaway/input';
import { participantSweepstakeSchema } from '@/schemas/giveaway/schemas';
import { DEFAULT_TEAM_LOGO } from '@/lib/settings';
import { toSweepstakesWinners } from '@/schemas/giveaway/participant';

const getParticipantSweepstake = procedure
  .authorization({
    required: false
  })
  .input(
    z.object({
      id: z.string()
    })
  )
  .output(participantSweepstakeSchema)
  .handler(async ({ input, db }) => {
    const sweepstakes = await db.sweepstakes.findUnique({
      where: {
        id: input.id
      },
      include: PARTICIPANT_SWEEPSTAKES_PAYLOAD
    });

    if (!sweepstakes || !sweepstakes.team) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `Sweepstakes with ID ${input.id} not found`
      });
    }

   

    const totalEntries = await db.taskCompletion.count({
      where: {
        task: {
          sweepstakesId: input.id
        }
      }
    });

    const totalUsers = await db.taskCompletion.findMany({
      select: {
        userId: true
      },
      distinct: ['userId'],
      where: {
        task: {
          sweepstakesId: input.id
        }
      }
    });

    const unparsed = {
      sweepstakes: {
        id: sweepstakes.id,
        status: sweepstakes.status,
        ...toSweepstakesInput(sweepstakes)
      },
      host: {
        id: sweepstakes.team.id,
        slug: sweepstakes.team.slug,
        name: sweepstakes.team.name,
        logo: sweepstakes.team.logo || DEFAULT_TEAM_LOGO
      },
      winners: toSweepstakesWinners(sweepstakes.prizes),
      participation: {
        totalUsers: totalUsers.length,
        totalEntries: totalEntries
      }
    };
    const parsed = participantSweepstakeSchema.safeParse(unparsed);

    if (!parsed.success) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        message: 'Sweepstakes data is invalid'
      });
    }

    return parsed.data;
  });

export default getParticipantSweepstake;
