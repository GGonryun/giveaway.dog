import { UserSource } from '@prisma/client';
import { Tx } from '../prisma';
import { computeSignupUserScore } from './signup';
import { computeImportedUserScore } from './imported';
import { assertNever } from '@giveaway/util-errors';

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
