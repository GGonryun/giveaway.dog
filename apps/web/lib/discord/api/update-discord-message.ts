import { ApplicationError } from '@giveaway/util-errors';
import {
  discordMessageResponseSchema,
  UpdateDiscordMessageOptions,
  type DiscordMessageResponseSchema
} from '@giveaway/discord-model/schemas';

export async function updateDiscordMessage(
  options: UpdateDiscordMessageOptions
): Promise<DiscordMessageResponseSchema> {
  if (!process.env.DISCORD_BOT_TOKEN) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Discord bot token is not configured'
    });
  }

  const response = await fetch(
    `https://discord.com/api/v10/channels/${options.channelId}/messages/${options.messageId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [options.embed],
        components: options.components
      })
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
      message:
        'Bot does not have permission to edit messages in this channel. Please check bot permissions.'
    });
  }

  if (response.status === 404) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: 'Message or channel not found'
    });
  }

  if (response.status === 400) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'Invalid message data sent to Discord',
      data: errorData
    });
  }

  if (!response.ok) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to update Discord message: ${response.status} ${response.statusText}`
    });
  }

  const data = await response.json();
  const parsed = discordMessageResponseSchema.safeParse(data);

  if (!parsed.success) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid Discord message response',
      cause: parsed.error
    });
  }

  return parsed.data;
}
