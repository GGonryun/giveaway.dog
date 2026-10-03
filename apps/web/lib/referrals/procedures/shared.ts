import { ApplicationError } from '@giveaway/util-errors';
import { Prisma, PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import { ReferredUserSchema, UserReferralSchema } from '../schemas';
import { UNKNOWN_USER_NAME } from '@giveaway/app-config/settings';

export const REFERRED_USER_INCLUDE = {
  user: true
} satisfies Prisma.ReferredUserInclude;

export const REFERRAL_USER_INCLUDE = {
  referredUsers: {
    include: REFERRED_USER_INCLUDE
  }
} satisfies Prisma.ReferralInclude;

export const getOrCreateReferral = async (
  db: PrismaClient,
  participantId: string,
  taskId: string
): Promise<
  Prisma.ReferralGetPayload<{ include: typeof REFERRAL_USER_INCLUDE }>
> => {
  const existing = await db.referral.findUnique({
    where: {
      participantId_taskId: {
        participantId,
        taskId
      }
    },
    include: REFERRAL_USER_INCLUDE
  });

  if (existing) return existing;

  const code = await generateReferral(db);

  const referral = await db.referral.create({
    data: {
      code,
      participantId,
      taskId
    },
    include: REFERRAL_USER_INCLUDE
  });

  return referral;
};

export const generateReferral = async (db: PrismaClient) => {
  let code = nanoid(6);
  let attempts = 0;

  while (attempts < 10) {
    const existing = await db.referral.findUnique({ where: { code } });
    if (!existing) break;
    code = nanoid(6);
    attempts++;
  }

  if (attempts >= 10) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to generate unique referral code'
    });
  }

  return code;
};

export const toReferralLink = ({
  sweepstakesId,
  code
}: {
  sweepstakesId: string;
  code: string;
}) => {
  return `${process.env.NEXT_PUBLIC_APP_URL}/browse/${sweepstakesId}?ref=${code}`;
};

export const toUserReferral = ({
  code,
  sweepstakesId,
  referredUsers
}: Prisma.ReferralGetPayload<{
  include: typeof REFERRAL_USER_INCLUDE;
}> & {
  sweepstakesId: string;
}): UserReferralSchema => {
  return {
    id: code,
    code,
    link: toReferralLink({ sweepstakesId, code }),
    referrals: toReferredUsers(referredUsers)
  };
};

export const toReferredUsers = (
  referredUsers: Prisma.ReferredUserGetPayload<{
    include: typeof REFERRED_USER_INCLUDE;
  }>[]
): ReferredUserSchema[] => {
  return referredUsers.map(({ user }) => ({
    user: {
      id: user.id,
      name: user.name ?? user.username ?? UNKNOWN_USER_NAME
    },
    createdAt: user.createdAt
  }));
};
