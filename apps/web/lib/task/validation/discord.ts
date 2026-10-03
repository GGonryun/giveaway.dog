import { ApplicationError } from '@giveaway/util-errors';
import { PrismaClient } from '@prisma/client';
import { refreshDiscordToken } from '@/lib/integrations/utils/refresh-discord-token';
import { DiscordJoinTaskSchema } from '../schemas';

export const checkDiscordJoin = async (
  db: PrismaClient,
  args: {
    task: DiscordJoinTaskSchema;
    userId: string;
  }
): Promise<void> => {
  const { access_token } = await refreshDiscordToken(db, {
    userId: args.userId
  });

  const channel = args.task.channel;
  const guildId = channel.match(/discord\.com\/channels\/(\d+)\//)?.[1];

  if (!guildId) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to extract Guild ID from the channel URL.'
    });
  }

  const response = await fetch(
    `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        silent: true,
        message: 'You are not a member of the required Discord server.',
        cause: await response.text()
      });
    }

    if (response.status === 401) {
      throw new ApplicationError({
        code: 'UNAUTHORIZED',
        message:
          'Discord authorization is invalid. Please reconnect your Discord account.',
        cause: await response.text()
      });
    }

    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to verify Discord server membership.',
      cause: await response.text()
    });
  }

  const memberData = await response.json();

  if (!memberData || !memberData.user) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      silent: true,
      message: 'You are not a member of the required Discord server.'
    });
  }
};
