import { assertNever } from '@/lib/errors';
import { CompletionStatus } from '@prisma/client';
import { TaskSchema } from '../schemas';

export const computeTaskStatus = (task: TaskSchema) => {
  switch (task.type) {
    case 'BONUS_TASK':
    case 'VISIT_URL':
    case 'STEAM_WISHLIST':
    case 'DISCORD_JOIN':
    case 'TWITCH_FOLLOW':
    case 'KICK_FOLLOW':
    case 'TWITTER_CONNECT':
    case 'TWITTER_FOLLOW':
    case 'SECRET_CODE':
      return CompletionStatus.COMPLETED;
    case 'TWITTER_RETWEET':
      return task.type === 'TWITTER_RETWEET' && task.validateEntries
        ? CompletionStatus.PENDING
        : CompletionStatus.COMPLETED;

    default:
      throw assertNever(task);
  }
};
