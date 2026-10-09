'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { procedure } from '@giveaway/rpc-server/procedures';
import { VisibilityType } from '@giveaway/db-model';
import z from 'zod';

const getCacheConfig = ({ user, input }: any) => {
  // Cache PUBLIC/UNLISTED checks for longer since they don't depend on user
  // Cache PRIVATE checks per-user since they depend on team membership
  const userKey = user?.id ? `-user-${user.id}` : '-anonymous';
  return {
    keyParts: [`sweepstakes-privacy-${input.sweepstakesId}${userKey}`],
    tags: [
      `sweepstakes-${input.sweepstakesId}-privacy`,
      ...(user?.id ? [`user-${user.id}-privacy`] : [])
    ],
    revalidate: 3600 // Cache for 1 hour
  };
};

export const getSweepstakesPrivacy = procedure(
  'participation-server/getSweepstakesPrivacy'
)
  .authorization({
    required: false
  })
  .input(
    z.object({
      sweepstakesId: z.string()
    })
  )
  .output(z.boolean())
  .cache(getCacheConfig)
  .handler(async ({ input, db, user }) => {
    // Implement the logic to fetch the sweepstakes visibility
    // For example, you might query the database to get the visibility status
    const sweepstakes = await db.sweepstakes.findFirst({
      where: {
        OR: [
          { id: input.sweepstakesId },
          { visibility: { slug: input.sweepstakesId } }
        ]
      },
      select: {
        teamId: true,
        visibility: {
          select: { visibility: true }
        }
      }
    });

    if (!sweepstakes?.visibility?.visibility) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Sweepstakes visibility is missing'
      });
    }

    // anyone can see public or unlisted sweepstakes
    if (sweepstakes.visibility.visibility !== VisibilityType.PRIVATE) {
      return true;
    }

    if (!sweepstakes.teamId) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Sweepstakes teamId is missing'
      });
    }

    if (!user?.id)
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'User is not authorized to view this sweepstakes'
      });

    const profile = await db.membership.findUnique({
      where: {
        userId_teamId: {
          userId: user.id,
          teamId: sweepstakes.teamId
        }
      },
      select: { id: true }
    });

    if (profile) {
      return true;
    }

    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'User is not authorized to view this sweepstakes'
    });
  });
