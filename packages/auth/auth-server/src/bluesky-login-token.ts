import 'server-only';

import { createHash, randomBytes } from 'crypto';
import { addSeconds } from 'date-fns';
import { Prisma } from '@giveaway/db-model';
import prisma from '@giveaway/db-client/prisma';

export const BLUESKY_LOGIN_TOKEN_PREFIX = 'bluesky-direct:';
export const BLUESKY_LOGIN_TOKEN_TTL_SECONDS = 60;

export const hashBlueskyLoginToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

const isRecordNotFound = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2025';

export const createBlueskyLoginToken = async (userId: string) => {
  const token = randomBytes(32).toString('hex');

  await prisma.verificationToken.create({
    data: {
      identifier: `${BLUESKY_LOGIN_TOKEN_PREFIX}${userId}`,
      token: hashBlueskyLoginToken(token),
      expires: addSeconds(new Date(), BLUESKY_LOGIN_TOKEN_TTL_SECONDS)
    }
  });

  return token;
};

export const redeemBlueskyLoginToken = async (token: unknown) => {
  if (typeof token !== 'string' || !token) {
    return null;
  }

  const hashedToken = hashBlueskyLoginToken(token);

  const stored = await prisma.verificationToken.findFirst({
    where: {
      token: hashedToken,
      identifier: { startsWith: BLUESKY_LOGIN_TOKEN_PREFIX }
    }
  });

  if (!stored) {
    return null;
  }

  const redeemed = await prisma.verificationToken
    .delete({
      where: {
        identifier_token: {
          identifier: stored.identifier,
          token: hashedToken
        }
      }
    })
    .catch((error: unknown) => {
      if (isRecordNotFound(error)) {
        return null;
      }
      throw error;
    });

  if (!redeemed || redeemed.expires <= new Date()) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id: redeemed.identifier.slice(BLUESKY_LOGIN_TOKEN_PREFIX.length)
    }
  });
};
