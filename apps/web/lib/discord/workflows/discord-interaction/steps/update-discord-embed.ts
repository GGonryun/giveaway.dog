import db from '@giveaway/db-client/prisma';
import { SWEEPSTAKES_DISCORD_POST_SELECT_QUERY } from '@/lib/automation/db';
import { updateDiscordMessage } from '../../../api/update-discord-message';
import { toSweepstakesEmbed } from '../../../embeds';

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
