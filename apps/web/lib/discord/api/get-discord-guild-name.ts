import { ApplicationError } from '@giveaway/util-errors';
import { discordGuildInfoSchema, type DiscordGuildInfoSchema } from './schemas';

export async function getDiscordGuildInfo(
  guildId: string
): Promise<DiscordGuildInfoSchema> {
  const response = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}`,
    {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
      }
    }
  );

  if (!response.ok) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch Discord guild information'
    });
  }

  const guildData = await response.json();

  const result = discordGuildInfoSchema.safeParse({
    id: guildData.id,
    name: guildData.name,
    icon: guildData.icon,
    owner_id: guildData.owner_id
  });

  if (!result.success) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid Discord guild data',
      cause: result.error
    });
  }

  return result.data;
}
