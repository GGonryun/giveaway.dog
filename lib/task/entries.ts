import { assertNever } from '../errors';
import { TaskCompletionSchema } from './completions';
import { EligibleTaskCompletion } from './queries';
import { parseTwitterProofSchema, TaskSchema, toTaskSchema } from './schemas';

export const countParticipantEntries = (completions: TaskCompletionSchema[]) =>
  completions.reduce(
    (sum, completion) => sum + countCompletionValue(completion),
    0
  );

export const countCompletionValue = (
  args: EligibleTaskCompletion | TaskCompletionSchema
) => {
  const task = 'config' in args.task ? toTaskSchema(args.task) : args.task;

  switch (task.type) {
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_LIKE_IMPORT': {
      const proof = parseTwitterProofSchema(args.proof);
      if (proof?.twitterVerified && task.verifiedBonus) {
        return task.value + task.verifiedBonus;
      }
      return task.value;
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
    case 'DISCORD_JOIN':
    case 'TWITCH_FOLLOW':
    case 'KICK_FOLLOW':
    case 'SECRET_CODE':
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
      return task.value;
    default:
      throw assertNever(task);
  }
};
