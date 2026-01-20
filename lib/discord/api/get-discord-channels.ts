import { ApplicationError } from '@/lib/errors';
import {
  discordGuildChannelsSchema,
  type DiscordGuildChannelsSchema
} from './schemas';

const TEXT_CHANNEL = 0;
const ANNOUNCEMENT_CHANNEL = 5;

export async function getDiscordGuildChannels(
  guildId: string
): Promise<DiscordGuildChannelsSchema> {
  if (!process.env.DISCORD_BOT_TOKEN) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Discord bot token is not configured'
    });
  }

  const response = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/channels`,
    {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
      }
    }
  );

  if (response.status === 401) {
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message: 'Discord bot token is invalid'
    });
  }

  if (response.status === 403) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'Bot does not have permission to view channels in this guild'
    });
  }

  if (response.status === 404) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: 'Guild not found or bot is not in this guild'
    });
  }

  if (!response.ok) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to fetch Discord channels: ${response.status} ${response.statusText}`
    });
  }

  const data = await response.json();
  const parsed = discordGuildChannelsSchema.safeParse(data);

  if (!parsed.success) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid Discord channel data',
      cause: parsed.error
    });
  }

  const textChannels = parsed.data.filter(
    (channel) =>
      channel.type === TEXT_CHANNEL || channel.type === ANNOUNCEMENT_CHANNEL
  );

  return textChannels;
}
