import { assertNever } from '@/lib/errors';
import { TASK_INPUT_SCHEMA, TaskSchema } from '../schemas';
import { Prisma } from '@prisma/client';

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
    case 'FACEBOOK_VISIT_PAGE': {
      if (!task.afterVisit) return Prisma.JsonNull;
      if (task.afterVisit.type !== 'QUESTION') return Prisma.JsonNull;

      const parsed = TASK_INPUT_SCHEMA.FACEBOOK_VISIT_PAGE.parse(data);

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
    case 'FACEBOOK_VIEW_POST':
    case 'BONUS_TASK':
    case 'BONUS_TIMED':
    case 'BONUS_LIMITED':
    case 'BONUS_LOYALTY':
    case 'STEAM_WISHLIST':
    case 'DISCORD_JOIN':
    case 'TWITCH_FOLLOW':
    case 'KICK_FOLLOW':
    case 'TWITTER_CONNECT':
    case 'TWITTER_FOLLOW':
    case 'TWITTER_LIKE':
    case 'TWITTER_RETWEET':
    case 'YOUTUBE_VISIT':
    case 'INSTAGRAM_VISIT':
    case 'INSTAGRAM_LIKE':
    case 'INSTAGRAM_COMMENT':
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_LIKE_IMPORT':
    case 'TIKTOK_FOLLOW':
      return Prisma.JsonNull;
    default:
      throw assertNever(task);
  }
};
