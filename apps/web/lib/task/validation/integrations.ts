import { PrismaClient } from '@prisma/client';
import { assertNever } from '@giveaway/util-errors';
import { checkSteamWishlist } from '@giveaway/steam-task-validation/steam';
import { checkDiscordJoin } from '@giveaway/discord-task-validation/discord';
import { TaskSchema } from '@giveaway/task-model/schemas';
import { checkTwitchFollow } from '@giveaway/twitch-task-validation/twitch';
import {
  checkSecretCode,
  checkSecretCodeV2
} from '@giveaway/task-validation-core/secret-code';
import {
  checkBonusCompleteProfile,
  checkBonusLimited,
  checkBonusLoyalty,
  checkBonusTimed
} from '@giveaway/task-validation-core/bonus';
import { checkVisitUrl } from '@giveaway/task-validation-core/visit-url';
import { checkAskQuestion } from '@giveaway/task-validation-core/ask-question';
import { checkSingleChoice } from '@giveaway/task-validation-core/single-choice';
import { checkMultipleChoice } from '@giveaway/task-validation-core/multiple-choice';
import {
  checkBlueskyConnect,
  checkBlueskyFollow,
  checkBlueskyLike,
  checkBlueskyRepost
} from '@giveaway/bluesky-task-validation/bluesky';
import {
  checkVeloraConnect,
  checkVeloraFollow
} from '@giveaway/velora-task-validation/velora';
import { ValidateTaskInput } from '@giveaway/task-model/types';

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
    case 'TWITTER_RETWEET_IMPORT_V2':
    case 'TWITTER_LIKE':
    case 'TWITTER_LIKE_IMPORT':
    case 'TWITCH_CHAT_IMPORT':
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
    case 'DISCORD_INTERACTION_IMPORT':
    case 'REFERRAL_LINK':
    case 'SUBMIT_MEDIA':
    case 'STEAM_FOLLOW':
      return Promise.resolve();
    case 'BLUESKY_CONNECT':
      return await checkBlueskyConnect(db, {
        ...input,
        task: input.task
      });
    case 'VELORA_CONNECT':
      return await checkVeloraConnect(db, {
        ...input,
        task: input.task
      });
    case 'LINKEDIN_CONNECT':
      return Promise.resolve();
    case 'LINKEDIN_FOLLOW':
      return Promise.resolve();
    case 'VELORA_FOLLOW':
      return await checkVeloraFollow(db, {
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
    case 'SECRET_CODE_V2':
      return await checkSecretCodeV2(db, {
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
