import { PrismaClient } from '@prisma/client';
import { assertNever } from '../../errors';
import { checkSteamWishlist } from './steam';
import { checkDiscordJoin } from './discord';
import { TaskSchema } from '../schemas';
import { checkTwitchFollow } from './twitch';
import { checkSecretCode } from './secret-code';
import {
  checkBonusCompleteProfile,
  checkBonusLimited,
  checkBonusLoyalty,
  checkBonusTimed
} from './bonus';
import { checkVisitUrl } from './visit-url';
import { checkAskQuestion } from './ask-question';
import { checkSingleChoice } from './single-choice';
import { checkMultipleChoice } from './multiple-choice';
import {
  checkBlueskyConnect,
  checkBlueskyFollow,
  checkBlueskyLike,
  checkBlueskyRepost
} from './bluesky';

export type ValidateTaskInput<T extends TaskSchema> = {
  task: T;
  userId: string;
  participantId: string;
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
    case 'TIKTOK_FOLLOW':
    case 'TIKTOK_LIKE':
    case 'BLUESKY_LIKE_IMPORT':
    case 'BLUESKY_REPOST_IMPORT':
    case 'REFERRAL_LINK':
    case 'SUBMIT_MEDIA':
    case 'STEAM_FOLLOW':
      return Promise.resolve();
    case 'BLUESKY_CONNECT':
      return await checkBlueskyConnect(db, {
        ...input,
        task: input.task
      });
    case 'BLUESKY_FOLLOW': {
      return await checkBlueskyFollow(db, {
        ...input,
        task: input.task
      });
    }
    case 'BLUESKY_LIKE': {
      return await checkBlueskyLike(db, {
        ...input,
        task: input.task
      });
    }
    case 'BLUESKY_REPOST': {
      return await checkBlueskyRepost(db, {
        ...input,
        task: input.task
      });
    }
    case 'BONUS_LIMITED':
      return await checkBonusLimited(db, { task: input.task });
    case 'BONUS_TIMED':
      return await checkBonusTimed(input.task);
    case 'BONUS_LOYALTY':
      return await checkBonusLoyalty(db, {
        ...input,
        task: input.task
      });
    case 'BONUS_COMPLETE_PROFILE':
      return await checkBonusCompleteProfile(db, {
        ...input,
        task: input.task
      });
    case 'STEAM_WISHLIST':
      return await checkSteamWishlist(db, {
        ...input,
        task: input.task
      });
    case 'DISCORD_JOIN':
      return await checkDiscordJoin(db, {
        ...input,
        task: input.task
      });
    case 'TWITCH_FOLLOW':
      return await checkTwitchFollow(db, {
        ...input,
        task: input.task
      });
    case 'SECRET_CODE':
      return await checkSecretCode(db, {
        ...input,
        task: input.task
      });
    case 'ASK_QUESTION':
      return await checkAskQuestion(db, {
        ...input,
        task: input.task
      });
    case 'SINGLE_CHOICE':
      return await checkSingleChoice(db, {
        ...input,
        task: input.task
      });
    case 'MULTIPLE_CHOICE':
      return await checkMultipleChoice(db, {
        ...input,
        task: input.task
      });
    default:
      throw assertNever(input.task);
  }
};
