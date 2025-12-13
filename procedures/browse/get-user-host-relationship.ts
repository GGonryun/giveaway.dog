'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { userHostRelationshipSchema } from '@/schemas/giveaway/schemas';

import z from 'zod';

export const getUserHostRelationship = procedure()
  .authorization({ required: false })
  .input(z.object({ sweepstakesId: z.string() }))
  .output(userHostRelationshipSchema.optional())
  .handler(async ({ db, user, input }) => {
    if (!user?.id) return undefined;

    const profile = await db.user.findUnique({
      where: { id: user.id }
    });

    if (!profile)
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message:
          'User profile does not exist. Update any of your account settings to continue.'
      });

    const host = await db.sweepstakes.findFirst({
      where: {
        OR: [
          { id: input.sweepstakesId },
          { visibility: { slug: input.sweepstakesId } }
        ]
      },
      select: {
        teamId: true
      }
    });

    if (!host) return undefined;

    // get me all the task completions for this user where the task's sweepstake is associated with the host of the sweepstake being queried
    const loyalty = await db.sweepstakesParticipant.count({
      where: {
        userId: user.id,
        sweepstakes: {
          teamId: host.teamId
        }
      }
    });

    return {
      loyalty
    };
  });
