import { PrismaClient } from '@prisma/client';
import { assertNever } from '../../errors';
import { checkSteamWishlist } from './steam';
import { checkDiscordJoin } from './discord';
import { TaskSchema } from '../schemas';
import { checkTwitchFollow } from './twitch';
import { checkSecretCode } from './secret-code';
import { checkBonusLimited, checkBonusLoyalty, checkBonusTimed } from './bonus';

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
  switch (input.task.type) {
    case 'BONUS_TASK':
    case 'VISIT_URL':
      return Promise.resolve(); // No validation needed
    case 'TWITTER_CONNECT':
    case 'TWITTER_FOLLOW':
    case 'TWITTER_RETWEET':
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_LIKE':
    case 'YOUTUBE_VISIT':
      return Promise.resolve(); // No validation possible
    case 'KICK_FOLLOW':
      // kick does not support public follower lists or an API to verify follows
      return Promise.resolve(); // No validation possible
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
    default:
      throw assertNever(input.task);
  }
};
