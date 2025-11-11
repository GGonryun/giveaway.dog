'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { PARTICIPANT_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { z } from 'zod';
import { ApplicationError } from '@/lib/errors';
import { toSweepstakesInput } from '@/schemas/giveaway/input';
import {
  ParticipantSweepstakeSchema,
  participantSweepstakeSchema
} from '@/schemas/giveaway/schemas';
import { DEFAULT_TEAM_LOGO } from '@/lib/settings';
import { toSweepstakesPrizes } from '@/schemas/giveaway/participant';
import { DeepNullable, DeepPartial } from '@/lib/types';
import { toDerivedSweepstakeStatus } from '@/schemas/sweepstakes';
import { parseSocialLinks } from '@/schemas/social-links';

const getParticipantSweepstake = procedure()
  .authorization({
    required: false
  })
  .input(
    z.object({
      sweepstakesId: z.string()
    })
  )
  .output(participantSweepstakeSchema)
  .handler(async ({ input, db }) => {
    const sweepstakes = await db.sweepstakes.findFirst({
      where: {
        OR: [
          { id: input.sweepstakesId },
          { visibility: { slug: input.sweepstakesId } }
        ]
      },
      include: PARTICIPANT_SWEEPSTAKES_PAYLOAD
    });

    if (!sweepstakes || !sweepstakes.team) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `Sweepstakes with ID ${input.sweepstakesId} not found`
      });
    }

    const totalEntries = await db.taskCompletion.count({
      where: {
        task: {
          sweepstakesId: sweepstakes.id
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
          sweepstakesId: sweepstakes.id
        }
      }
    });

    const unparsed: DeepPartial<DeepNullable<ParticipantSweepstakeSchema>> = {
      sweepstakes: {
        id: sweepstakes.id,
        status: toDerivedSweepstakeStatus(sweepstakes),
        ...toSweepstakesInput(sweepstakes)
      },
      host: {
        id: sweepstakes.team.id,
        slug: sweepstakes.team.slug,
        name: sweepstakes.team.name,
        logo: sweepstakes.team.logo || DEFAULT_TEAM_LOGO,
        links: parseSocialLinks(sweepstakes.team.links)
      },
      prizes: toSweepstakesPrizes(sweepstakes.prizes),
      participation: {
        totalUsers: totalUsers.length,
        totalEntries: totalEntries
      }
    };
    const parsed = participantSweepstakeSchema.safeParse(unparsed);

    if (!parsed.success) {
      console.error('Sweepstakes parse error:', parsed.error);
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        message: 'Sweepstakes data is invalid',
        cause: parsed.error
      });
    }

    return parsed.data;
  });

export default getParticipantSweepstake;
