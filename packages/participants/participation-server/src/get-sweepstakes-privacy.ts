'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import {
  isMembersOnly,
  isTeamMember,
  VISIBILITY_SELECT_QUERY
} from './visibility';

const getCacheConfig = ({ user, input }: any) => {
  // Cache PUBLIC/UNLISTED checks for longer since they don't depend on user
  // Cache PRIVATE checks per-user since they depend on team membership
  const userKey = user?.id ? `-user-${user.id}` : '-anonymous';
  return {
    keyParts: [`sweepstakes-privacy-v2-${input.sweepstakesId}${userKey}`],
    tags: [
      `sweepstakes-${input.sweepstakesId}-privacy`,
      ...(user?.id ? [`user-${user.id}-privacy`] : [])
    ],
    revalidate: 3600 // Cache for 1 hour
  };
};

export const getSweepstakesPrivacy = procedure()
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
      select: VISIBILITY_SELECT_QUERY
    });

    if (!sweepstakes?.visibility?.visibility) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Sweepstakes visibility is missing'
      });
    }

    if (!isMembersOnly(sweepstakes)) {
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

    if (await isTeamMember({ db, userId: user.id, sweepstakes })) {
      return true;
    }

    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'User is not authorized to view this sweepstakes'
    });
  });
