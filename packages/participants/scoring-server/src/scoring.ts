import 'server-only';

import { PrismaClient, UserSource } from '@giveaway/db-model';
import { Tx } from '@giveaway/db-client/prisma';
import { computeSignupUserScore } from './signup';
import { computeImportedUserScore } from './imported';
import { assertNever } from '@giveaway/util-errors';
import { MAX_SCORING_REQUESTS_PER_RUN } from '@giveaway/scoring-model/user-scoring';
import type { UserRunScope } from './tracking';

export const computeUserQualityScore = async (tx: Tx, userId: string) => {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { id: true, source: true, createdAt: true }
  });

  if (!user) return;

  switch (user.source) {
    case UserSource.SIGNUP:
    case UserSource.ANONYMOUS:
    case UserSource.MANUAL_IMPORT:
      await computeSignupUserScore(tx, userId);
      break;

    case UserSource.DISCORD_IMPORT:
    case UserSource.TWITTER_IMPORT:
    case UserSource.BLUESKY_IMPORT:
    case UserSource.TWITCH_IMPORT:
      await computeImportedUserScore(tx, userId);
      break;

    default:
      throw assertNever(user.source);
  }
};

export const runScoring = async (
  db: PrismaClient,
  { userId }: UserRunScope = {}
) => {
  const requests = await db.userScoringRequest.findMany({
    ...(userId === undefined ? {} : { where: { userId } }),
    take: MAX_SCORING_REQUESTS_PER_RUN,
    orderBy: {
      createdAt: 'asc'
    }
  });

  console.info('Scoring requests:', requests.length);

  for (const request of requests) {
    await db.$transaction(async (tx) => {
      await computeUserQualityScore(tx, request.userId);
      await db.userScoringRequest.delete({
        where: { id: request.id }
      });
      console.info(`Processed scoring request for user ${request.userId}`);
    });
  }

  return { processed: requests.length };
};
