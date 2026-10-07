import 'server-only';

import { ApplicationError } from '@giveaway/util-errors';
import { parseProviderResponse } from '@giveaway/integration-server/provider-response';
import {
  discordGuildInfoSchema,
  type DiscordGuildInfoSchema
} from '@giveaway/discord-model/schemas';

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

  return parseProviderResponse({
    provider: 'discord',
    call: 'GET /guilds/:id',
    schema: discordGuildInfoSchema,
    data: await response.json()
  });
}
