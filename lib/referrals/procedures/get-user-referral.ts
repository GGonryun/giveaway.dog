'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { createReferralSchema, userReferralSchema } from '../schemas';
import { REFERRAL_USER_INCLUDE, toUserReferral } from './shared';
import { ApplicationError } from '@/lib/errors';

const getCacheConfig = ({ user, input }: any) => {
  if (!user?.id) return undefined; // Don't cache if no user
  return {
    keyParts: [`user-referral-${user.id}-${input.sweepstakesId}`],
    tags: [`user-${user.id}-referral`, `sweepstakes-${input.sweepstakesId}-referral`],
    revalidate: 86400 // Cache for 24 hours
  };
};

export const getUserReferral = procedure()
  .authorization({ required: false })
  .input(createReferralSchema.omit({ taskId: true }))
  .output(userReferralSchema.optional())
  .cache(getCacheConfig)
  .handler(async ({ db, user, input: { sweepstakesId } }) => {
    if (!user?.id) return undefined;

    const participant = await db.sweepstakesParticipant.findUnique({
      where: {
        userId_sweepstakesId: {
          userId: user.id,
          sweepstakesId
        }
      },
      include: {
        referrals: {
          where: {
            task: {
              sweepstakesId
            }
          },
          include: REFERRAL_USER_INCLUDE
        }
      }
    });

    if (!participant || !participant.referrals[0]) {
      return undefined;
    }

    if (participant.referrals.length > 1) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Multiple referrals found for the same task'
      });
    }

    return toUserReferral({ ...participant.referrals[0], sweepstakesId });
  });
