import { PrismaClient } from '@prisma/client';
import { assertNever } from '../../errors';
import { checkSteamWishlist } from './steam';
import { checkDiscordJoin } from './discord';
import { TaskSchema } from '../schemas';
import { checkTwitchFollow } from './twitch';

export const validateTask = async <T extends TaskSchema>(
  db: PrismaClient,
  input: {
    task: T;
    userId: string;
  }
): Promise<void> => {
  switch (input.task.type) {
    case 'BONUS_TASK':
    case 'VISIT_URL':
      return Promise.resolve(); // No validation needed
    case 'TWITTER_CONNECT':
    case 'TWITTER_FOLLOW':
    case 'TWITTER_RETWEET':
      return Promise.resolve(); // No validation possible
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
    default:
      throw assertNever(input.task);
  }
};
