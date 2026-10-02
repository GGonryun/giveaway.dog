import { ApplicationError } from '@/lib/errors';
import {
  discordGuildRolesSchema,
  type DiscordGuildRolesSchema
} from './schemas';

export async function getDiscordGuildRoles(
  guildId: string
): Promise<DiscordGuildRolesSchema> {
  const response = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/roles`,
    {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
      }
    }
  );

  if (!response.ok) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch Discord guild roles'
    });
  }

  const rolesData = await response.json();

  const result = discordGuildRolesSchema.safeParse(rolesData);

  if (!result.success) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid Discord guild roles data',
      cause: result.error
    });
  }

  return result.data;
}
