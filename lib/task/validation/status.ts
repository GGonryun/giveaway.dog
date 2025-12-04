import { assertNever } from '@/lib/errors';
import { CompletionStatus } from '@prisma/client';
import { TaskSchema } from '../schemas';

export const computeTaskStatus = (task: TaskSchema) => {
  switch (task.type) {
    case 'BONUS_TASK':
    case 'BONUS_TIMED':
    case 'BONUS_LIMITED':
    case 'BONUS_LOYALTY':
    case 'VISIT_URL':
    case 'STEAM_WISHLIST':
    case 'DISCORD_JOIN':
    case 'TWITCH_FOLLOW':
    case 'KICK_FOLLOW':
    case 'TWITTER_CONNECT':
    case 'TWITTER_FOLLOW':
    case 'TWITTER_LIKE':
    case 'SECRET_CODE':
    case 'YOUTUBE_VISIT':
    case 'TWITTER_RETWEET':
      return CompletionStatus.COMPLETED;
    case 'TWITTER_RETWEET_IMPORT':
      return CompletionStatus.PENDING;

    default:
      throw assertNever(task);
  }
};
