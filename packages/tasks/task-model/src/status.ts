import { assertNever } from '@giveaway/util-errors';
import { CompletionStatus } from '@giveaway/db-model';
import { TaskSchema } from './schemas';

export const computeTaskStatus = (task: TaskSchema) => {
  switch (task.type) {
    case 'BONUS_TASK':
    case 'BONUS_TIMED':
    case 'BONUS_LIMITED':
    case 'BONUS_LOYALTY':
    case 'BONUS_COMPLETE_PROFILE':
    case 'VISIT_URL':
    case 'STEAM_WISHLIST':
    case 'STEAM_FOLLOW':
    case 'DISCORD_JOIN':
    case 'TWITCH_FOLLOW':
    case 'KICK_FOLLOW':
    case 'TWITTER_CONNECT':
    case 'TWITTER_FOLLOW':
    case 'TWITTER_LIKE':
    case 'TWITTER_RETWEET':
    case 'SECRET_CODE':
    case 'SECRET_CODE_V2':
    case 'YOUTUBE_VISIT':
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
    case 'VELORA_CONNECT':
    case 'VELORA_FOLLOW':
    case 'LINKEDIN_CONNECT':
    case 'LINKEDIN_FOLLOW':
    case 'ASK_QUESTION':
    case 'SINGLE_CHOICE':
    case 'MULTIPLE_CHOICE':
    case 'REFERRAL_LINK':
    case 'SUBMIT_MEDIA':
      return CompletionStatus.COMPLETED;
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_RETWEET_IMPORT_V2':
    case 'TWITTER_LIKE_IMPORT':
    case 'BLUESKY_LIKE_IMPORT':
    case 'BLUESKY_REPOST_IMPORT':
    case 'DISCORD_INTERACTION_IMPORT':
    case 'TWITCH_CHAT_IMPORT':
      return CompletionStatus.PENDING;
    default:
      throw assertNever(task);
  }
};
