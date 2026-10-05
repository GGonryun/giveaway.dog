import 'server-only';

import db from '@giveaway/db-client/prisma';
import { SWEEPSTAKES_DISCORD_POST_SELECT_QUERY } from '@giveaway/automation-model/db';
import { updateDiscordMessage } from '@giveaway/discord-api/update-discord-message';
import { toSweepstakesEmbed } from '@giveaway/discord-api/embeds';

export async function updateDiscordEmbed({
  channelId,
  messageId,
  sweepstakesId
}: {
  channelId: string;
  messageId: string;
  sweepstakesId: string;
}): Promise<void> {
  'use step';

  const sweepstakes = await db.sweepstakes.findUnique({
    where: { id: sweepstakesId },
    select: SWEEPSTAKES_DISCORD_POST_SELECT_QUERY
  });

  if (!sweepstakes) return;

  await updateDiscordMessage({
    channelId,
    messageId,
    embed: await toSweepstakesEmbed({ sweepstakes, db })
  });
}
