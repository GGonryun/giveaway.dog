import { UserSource } from '@prisma/client';
import { Tx } from '../prisma';
import { computeSignupUserScore } from './signup';
import { computeTwitterUserScore } from './twitter';
import { computeBlueskyUserScore } from './bluesky';
import { computeDiscordUserScore } from './discord';
import { assertNever } from '../errors';

// Routes to appropriate scoring function based on user source
export const computeUserQualityScore = async (tx: Tx, userId: string) => {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { id: true, source: true, createdAt: true }
  });

  if (!user) return;

  // Check for pending scoring request with platform data
  const scoringRequest = await tx.userScoringRequest.findUnique({
    where: { userId }
  });

  // Route to appropriate scorer based on user source
  switch (user.source) {
    case UserSource.SIGNUP:
    case UserSource.ANONYMOUS:
    case UserSource.MANUAL_IMPORT:
      await computeSignupUserScore(tx, userId);
      break;

    case UserSource.DISCORD_IMPORT:
      await computeDiscordUserScore(tx, userId, scoringRequest?.data);
      break;

    case UserSource.TWITTER_IMPORT:
      await computeTwitterUserScore(tx, userId, scoringRequest?.data);
      break;

    case UserSource.BLUESKY_IMPORT:
      await computeBlueskyUserScore(tx, userId, scoringRequest?.data);
      break;

    default:
      throw assertNever(user.source);
  }
};
