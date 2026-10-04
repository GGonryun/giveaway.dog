'use server';

import {
  clearReferralCodeCookie,
  getReferralCodeFromServerCookies
} from '@giveaway/referrals-model/cookies';
import { Prisma, PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { toTaskSchema } from '@giveaway/task-model/schemas';

export type ValidateReferralArgs = {
  participant: Prisma.SweepstakesParticipantGetPayload<{}>;
  completions: Prisma.TaskCompletionGetPayload<{}>[];
  taskId: string;
};

export const validateReferral = async (
  db: PrismaClient,
  { taskId, completions, participant }: ValidateReferralArgs
) => {
  const cookieStore = await cookies();
  const referralCode = getReferralCodeFromServerCookies(cookieStore);

  // if there is no referral code do nothing.
  if (!referralCode) {
    console.info('[Referral] No referral code found in cookies', {
      userId: participant.userId,
      sweepstakesId: participant.sweepstakesId,
      taskId
    });
    return;
  }

  // if the user has already completed a task do nothing.
  // referrals are only valid for users who have not yet completed any action/task.
  if (completions.length > 0) {
    console.info('[Referral] User already has completions, skipping referral', {
      userId: participant.userId,
      sweepstakesId: participant.sweepstakesId,
      referralCode,
      completionsCount: completions.length
    });
    clearReferralCodeCookie();
    return;
  }

  const referral = await db.referral.findUnique({
    where: { code: referralCode },
    include: {
      task: true,
      participant: true,
      referredUsers: true
    }
  });

  // if this referral code does not exist do nothing.
  if (!referral) {
    console.info('[Referral] Referral code not found in database', {
      userId: participant.userId,
      sweepstakesId: participant.sweepstakesId,
      referralCode
    });
    clearReferralCodeCookie();
    return;
  }

  // if this referral code is for a different sweepstakes do nothing.
  if (referral.task.sweepstakesId !== participant.sweepstakesId) {
    console.info('[Referral] Referral code is for a different sweepstakes', {
      userId: participant.userId,
      participantSweepstakesId: participant.sweepstakesId,
      referralSweepstakesId: referral.task.sweepstakesId,
      referralCode
    });
    clearReferralCodeCookie();
    return;
  }

  // if the referral code belongs to the same user do nothing.
  if (referral.participant.userId === participant.userId) {
    console.info('[Referral] User attempted to use their own referral code', {
      userId: participant.userId,
      sweepstakesId: participant.sweepstakesId,
      referralCode
    });
    clearReferralCodeCookie();
    return;
  }

  const existingRef = await db.referredUser.findUnique({
    where: {
      referralId_userId: {
        referralId: referral.id,
        userId: participant.userId
      }
    }
  });

  // if the user has already been referred by this referral code do nothing.
  if (existingRef) {
    console.info('[Referral] User already referred by this code', {
      userId: participant.userId,
      sweepstakesId: participant.sweepstakesId,
      referralCode,
      referralId: referral.id
    });
    clearReferralCodeCookie();
    return;
  }

  const taskConfig = toTaskSchema(referral.task);
  const maximum =
    'maximum' in taskConfig && taskConfig.maximum
      ? taskConfig.maximum
      : Infinity;
  const currentReferrals = referral.referredUsers.length;

  console.info('[Referral] Processing referral', {
    userId: participant.userId,
    sweepstakesId: participant.sweepstakesId,
    referralCode,
    referralId: referral.id,
    referrerUserId: referral.participant.userId,
    currentReferrals,
    maximum
  });

  await db.$transaction(async (tx) => {
    await tx.referredUser.create({
      data: {
        referralId: referral.id,
        userId: participant.userId
      }
    });

    if (currentReferrals < maximum) {
      await tx.taskCompletion.create({
        data: {
          participantId: referral.participantId,
          taskId: referral.taskId,
          status: 'COMPLETED',
          proof: {
            referralId: referral.id,
            referredUserId: participant.userId,
            sourceTaskId: taskId
          }
        }
      });
      console.info('[Referral] Referral completed successfully', {
        userId: participant.userId,
        referrerUserId: referral.participant.userId,
        sweepstakesId: participant.sweepstakesId,
        referralCode,
        newReferralCount: currentReferrals + 1,
        maximum
      });
    } else {
      console.info(
        '[Referral] Maximum referrals reached, user added but no completion created',
        {
          userId: participant.userId,
          referrerUserId: referral.participant.userId,
          sweepstakesId: participant.sweepstakesId,
          referralCode,
          currentReferrals,
          maximum
        }
      );
    }
  });

  clearReferralCodeCookie();
};
