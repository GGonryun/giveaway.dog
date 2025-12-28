import { SweepstakesInputTaskSchema } from '@/schemas/giveaway/db';
import { Prisma, SweepstakesStatus } from '@prisma/client';
import { assertNever } from '../errors';
import { RequiredFields } from '../types';

export const createJobsForTask = (
  task: RequiredFields<SweepstakesInputTaskSchema, 'id'>,
  status?: SweepstakesStatus
): Prisma.TaskJobCreateWithoutTaskInput[] => {
  if (status !== 'ACTIVE') {
    return [];
  }
  if (!task?.type) return [];
  switch (task.type) {
    case 'VISIT_URL':
    case 'BONUS_TASK':
    case 'BONUS_COMPLETE_PROFILE':
    case 'BONUS_TIMED':
    case 'DISCORD_JOIN':
    case 'TWITCH_FOLLOW':
    case 'KICK_FOLLOW':
    case 'SECRET_CODE':
    case 'STEAM_WISHLIST':
    case 'BONUS_LIMITED':
    case 'TWITTER_FOLLOW':
    case 'TWITTER_CONNECT':
    case 'TWITTER_LIKE':
    case 'YOUTUBE_VISIT':
    case 'BONUS_LOYALTY':
    case 'TWITTER_RETWEET':
    case 'INSTAGRAM_VISIT':
    case 'INSTAGRAM_LIKE':
    case 'INSTAGRAM_COMMENT':
    case 'FACEBOOK_VISIT_PAGE':
    case 'FACEBOOK_VIEW_POST':
    case 'TIKTOK_FOLLOW':
    case 'TIKTOK_LIKE':
    case 'BLUESKY_CONNECT':
    case 'BLUESKY_FOLLOW':
    case 'BLUESKY_LIKE':
    case 'BLUESKY_REPOST':
    case 'ASK_QUESTION':
    case 'SINGLE_CHOICE':
    case 'MULTIPLE_CHOICE':
      return [];
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_LIKE_IMPORT':
      return [
        {
          runAt: new Date(),
          data: {
            runs: 0
          }
        }
      ];
    default:
      throw assertNever(task.type);
  }
};
