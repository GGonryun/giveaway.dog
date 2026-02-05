import { assertNever } from '../errors';
import { TaskCompletionSchema } from './completions';
import { parseTwitterProofSchema, TaskSchema } from './schemas';

export type CompletionValueArgs = {
  task: TaskSchema;
  proof: unknown;
};

export const toParticipantEntries = (completions: TaskCompletionSchema[]) =>
  completions.reduce(
    (sum, completion) =>
      sum +
      toCompletionValue({ task: completion.task, proof: completion.proof }),
    0
  );

export const toCompletionValue = (args: CompletionValueArgs) => {
  switch (args.task.type) {
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_LIKE_IMPORT': {
      const proof = parseTwitterProofSchema(args.proof);
      if (proof?.twitterVerified && args.task.verifiedBonus) {
        return args.task.value + args.task.verifiedBonus;
      }
      return args.task.value;
    }
    case 'BONUS_TASK':
    case 'BONUS_TIMED':
    case 'BONUS_LIMITED':
    case 'BONUS_LOYALTY':
    case 'BONUS_COMPLETE_PROFILE':
    case 'VISIT_URL':
    case 'ASK_QUESTION':
    case 'SINGLE_CHOICE':
    case 'MULTIPLE_CHOICE':
    case 'TWITTER_CONNECT':
    case 'TWITTER_FOLLOW':
    case 'TWITTER_RETWEET':
    case 'TWITTER_LIKE':
    case 'STEAM_WISHLIST':
    case 'STEAM_FOLLOW':
    case 'DISCORD_JOIN':
    case 'DISCORD_INTERACTION_IMPORT':
    case 'TWITCH_FOLLOW':
    case 'KICK_FOLLOW':
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
    case 'BLUESKY_LIKE_IMPORT':
    case 'BLUESKY_REPOST_IMPORT':
    case 'REFERRAL_LINK':
    case 'SUBMIT_MEDIA':
      return args.task.value;
    default:
      throw assertNever(args.task);
  }
};
