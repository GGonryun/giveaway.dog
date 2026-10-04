'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import {
  createReferralSchema,
  userReferralSchema
} from '@giveaway/referrals-model/schemas';
import { getOrCreateReferral, toUserReferral } from './shared';

const createReferralCode = procedure()
  .authorization({ required: true })
  .input(createReferralSchema)
  .output(userReferralSchema)
  .invalidate(async ({ user, input }) => [
    `user-${user.id}-referral`,
    `sweepstakes-${input.sweepstakesId}-referral`
  ])
  .handler(async ({ db, user, input: { taskId, sweepstakesId } }) => {
    const participant = await db.sweepstakesParticipant.findUnique({
      where: {
        userId_sweepstakesId: {
          userId: user.id,
          sweepstakesId
        }
      }
    });

    if (!participant) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'You must enter the giveaway before generating a referral code'
      });
    }

    const referral = await getOrCreateReferral(db, participant.id, taskId);

    return toUserReferral({ ...referral, sweepstakesId });
  });

export default createReferralCode;
