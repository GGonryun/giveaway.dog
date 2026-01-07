import { assertNever } from '@/lib/errors';
import { TASK_INPUT_SCHEMA, TaskSchema } from '../schemas';
import { Prisma } from '@prisma/client';
import { INSTAGRAM_USERNAME_QUESTION } from '../components/public-sweepstakes/task-actions/lib/instagram/constants';

export const saveTaskProof = (task: TaskSchema, data: unknown) => {
  switch (task.type) {
    case 'VISIT_URL': {
      if (!task.afterVisit) return Prisma.JsonNull;
      if (task.afterVisit.type !== 'QUESTION') return Prisma.JsonNull;

      const parsed = TASK_INPUT_SCHEMA.VISIT_URL.parse(data);

      return {
        question: task.afterVisit.question,
        answer: parsed.answer
      };
    }
    case 'SECRET_CODE': {
      const parsed = TASK_INPUT_SCHEMA.SECRET_CODE.parse(data);
      return {
        code: parsed.code
      };
    }
    case 'ASK_QUESTION': {
      const parsed = TASK_INPUT_SCHEMA.ASK_QUESTION.parse(data);
      return {
        question: task.question,
        answer: parsed.answer
      };
    }
    case 'SINGLE_CHOICE': {
      const parsed = TASK_INPUT_SCHEMA.SINGLE_CHOICE.parse(data);
      return {
        question: task.question,
        options: task.options,
        choice: parsed.choice
      };
    }
    case 'MULTIPLE_CHOICE': {
      const parsed = TASK_INPUT_SCHEMA.MULTIPLE_CHOICE.parse(data);
      return {
        question: task.question,
        options: task.options,
        choices: parsed.choices
      };
    }
    case 'SUBMIT_MEDIA': {
      const parsed = TASK_INPUT_SCHEMA.SUBMIT_MEDIA.parse(data);
      return {
        mediaUrl: parsed.mediaUrl
      };
    }
    case 'STEAM_FOLLOW': {
      if (!task.requireProof) return Prisma.JsonNull;
      const parsed = TASK_INPUT_SCHEMA.STEAM_FOLLOW.parse(data);
      if (!parsed.mediaUrl) return Prisma.JsonNull;
      return {
        mediaUrl: parsed.mediaUrl
      };
    }
    case 'INSTAGRAM_LIKE': {
      const parsed = TASK_INPUT_SCHEMA.INSTAGRAM_LIKE.parse(data);

      return {
        question: INSTAGRAM_USERNAME_QUESTION,
        username: parsed.username
      };
    }
    case 'INSTAGRAM_COMMENT': {
      const parsed = TASK_INPUT_SCHEMA.INSTAGRAM_COMMENT.parse(data);

      return {
        question: INSTAGRAM_USERNAME_QUESTION,
        username: parsed.username
      };
    }
    case 'INSTAGRAM_VISIT':
    case 'FACEBOOK_VIEW_POST':
    case 'FACEBOOK_VISIT_PAGE':
    case 'BONUS_TASK':
    case 'BONUS_TIMED':
    case 'BONUS_LIMITED':
    case 'BONUS_LOYALTY':
    case 'BONUS_COMPLETE_PROFILE':
    case 'STEAM_WISHLIST':
    case 'DISCORD_JOIN':
    case 'TWITCH_FOLLOW':
    case 'KICK_FOLLOW':
    case 'TWITTER_CONNECT':
    case 'TWITTER_FOLLOW':
    case 'TWITTER_LIKE':
    case 'TWITTER_RETWEET':
    case 'YOUTUBE_VISIT':
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_LIKE_IMPORT':
    case 'TIKTOK_FOLLOW':
    case 'TIKTOK_LIKE':
    case 'BLUESKY_CONNECT':
    case 'BLUESKY_FOLLOW':
    case 'BLUESKY_LIKE':
    case 'BLUESKY_REPOST':
    case 'BLUESKY_LIKE_IMPORT':
    case 'BLUESKY_REPOST_IMPORT':
    case 'REFERRAL_LINK':
      return Prisma.JsonNull;
    default:
      throw assertNever(task);
  }
};
