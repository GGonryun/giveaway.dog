import { PrismaClient } from '@prisma/client';
import { assertNever } from '../../errors';
import { checkSteamWishlist } from './steam';
import { checkDiscordJoin } from './discord';
import { TaskSchema } from '../schemas';
import { checkTwitchFollow } from './twitch';
import { checkSecretCode } from './secret-code';
import { checkBonusLimited, checkBonusLoyalty, checkBonusTimed } from './bonus';
import { checkVisitUrl } from './visit-url';
import { checkAskQuestion } from './ask-question';
import { checkSingleChoice } from './single-choice';
import { checkMultipleChoice } from './multiple-choice';

export type ValidateTaskInput<T extends TaskSchema> = {
  task: T;
  userId: string;
  teamId: string;
  data?: unknown;
};

export const validateTask = async <T extends TaskSchema>(
  db: PrismaClient,
  input: ValidateTaskInput<T>
): Promise<void> => {
  if ('validation' in input.task && input.task.validation?.type === 'NONE') {
    return Promise.resolve();
  }

  switch (input.task.type) {
    case 'VISIT_URL':
      return await checkVisitUrl({
        ...input,
        task: input.task
      });
    case 'BONUS_TASK':
    case 'TWITTER_CONNECT':
    case 'TWITTER_FOLLOW':
    case 'TWITTER_RETWEET':
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_LIKE':
    case 'TWITTER_LIKE_IMPORT':
    case 'YOUTUBE_VISIT':
    case 'KICK_FOLLOW':
    case 'INSTAGRAM_VISIT':
    case 'INSTAGRAM_LIKE':
    case 'INSTAGRAM_COMMENT':
    case 'FACEBOOK_VISIT_PAGE':
    case 'FACEBOOK_VIEW_POST':
      return Promise.resolve(); // No validation possible/needed
    case 'BONUS_LIMITED':
      return await checkBonusLimited(db, { task: input.task });
    case 'BONUS_TIMED':
      return await checkBonusTimed(input.task);
    case 'BONUS_LOYALTY':
      return await checkBonusLoyalty(db, {
        task: input.task,
        userId: input.userId,
        teamId: input.teamId,
        data: input.data
      });
    case 'STEAM_WISHLIST':
      return await checkSteamWishlist(db, {
        task: input.task,
        userId: input.userId
      });
    case 'DISCORD_JOIN':
      return await checkDiscordJoin(db, {
        task: input.task,
        userId: input.userId
      });
    case 'TWITCH_FOLLOW':
      return await checkTwitchFollow(db, {
        task: input.task,
        userId: input.userId
      });
    case 'SECRET_CODE':
      return await checkSecretCode(db, {
        task: input.task,
        userId: input.userId,
        teamId: input.teamId,
        data: input.data
      });
    case 'ASK_QUESTION':
      return await checkAskQuestion(db, {
        task: input.task,
        userId: input.userId,
        teamId: input.teamId,
        data: input.data
      });
    case 'SINGLE_CHOICE':
      return await checkSingleChoice(db, {
        task: input.task,
        userId: input.userId,
        teamId: input.teamId,
        data: input.data
      });
    case 'MULTIPLE_CHOICE':
      return await checkMultipleChoice(db, {
        task: input.task,
        userId: input.userId,
        teamId: input.teamId,
        data: input.data
      });
    default:
      throw assertNever(input.task);
  }
};
