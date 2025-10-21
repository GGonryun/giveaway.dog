import { ApplicationError } from '@/lib/errors';
import { DiscordJoinTaskSchema } from '@/schemas/tasks/schemas';
import { PrismaClient } from '@prisma/client';

export const checkDiscordJoin = async (
  db: PrismaClient,
  args: {
    task: DiscordJoinTaskSchema;
    userId: string;
  }
): Promise<void> => {
  const discordAccount = await db.account.findFirst({
    where: {
      userId: args.userId,
      provider: 'discord'
    }
  });

  if (!discordAccount) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message:
        'You must connect your Discord account before completing this task.'
    });
  }

  if (!discordAccount.access_token) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message:
        'Discord access token not found. Please reconnect your Discord account.'
    });
  }

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
        Authorization: `Bearer ${discordAccount.access_token}`
      }
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
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
      message: 'You are not a member of the required Discord server.'
    });
  }
};
