import { procedure } from '@/lib/mrpc/procedures';
import { FULL_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { z } from 'zod';
import { ApplicationError } from '@/lib/errors';
import { toSweepstakesInput } from '@/schemas/giveaway/input';
import {
  giveawayFormSchema,
  participantSweepstakeSchema
} from '@/schemas/giveaway/schemas';

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
  .handler(async ({ input, db, user }) => {
    const sweepstakes = await db.sweepstakes.findUnique({
      where: {
        id: input.id
      },
      include: { ...FULL_SWEEPSTAKES_PAYLOAD, team: true }
    });

    if (!sweepstakes) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `Sweepstakes with ID ${input.id} not found`
      });
    }
    if (!sweepstakes || !sweepstakes.team) {
      throw new Error('Sweepstakes not found or not active');
    }

    const parsed = giveawayFormSchema.safeParse(
      toSweepstakesInput(sweepstakes)
    );

    if (!parsed.success) {
      console.error(`Failed to parse sweepstakes:`, parsed.error);
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Sweepstakes data is invalid'
      });
    }

    return {
      giveaway: {
        id: sweepstakes.id,
        status: sweepstakes.status,
        ...parsed.data
      },
      host: {
        id: sweepstakes.team.id,
        slug: sweepstakes.team.slug,
        name: sweepstakes.team.name,
        avatar: sweepstakes.team.logo || '🐶'
      }
    };
  });

export default getParticipantSweepstake;
