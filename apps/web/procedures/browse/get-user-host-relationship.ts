'use server';

import { getLoyalty } from '@giveaway/loyalty-model/db';
import { userHostRelationshipSchema } from '@giveaway/loyalty-model/schemas';
import { procedure } from '@giveaway/rpc-server/procedures';

import z from 'zod';

const getCacheConfig = ({ user, input }: any) => {
  if (!user?.id) return undefined; // Don't cache if no user
  return {
    keyParts: [`user-host-relationship-${user.id}-${input.sweepstakesId}`],
    tags: [
      `user-${user.id}-host-relationship`,
      `sweepstakes-${input.sweepstakesId}-host`
    ],
    revalidate: 3600 // Cache for 1 hour
  };
};

export const getUserHostRelationship = procedure()
  .authorization({ required: false })
  .input(z.object({ sweepstakesId: z.string() }))
  .output(userHostRelationshipSchema.optional())
  .cache(getCacheConfig)
  .handler(async ({ db, user, input }) => {
    if (!user?.id) return undefined;

    const profile = await db.user.findUnique({
      where: { id: user.id }
    });

    if (!profile) return undefined;

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

    if (!host?.teamId) return undefined;

    // get me all the task completions for this user where the task's sweepstake is associated with the host of the sweepstake being queried

    return {
      loyalty: await getLoyalty(db, { userId: user.id, teamId: host.teamId })
    };
  });
