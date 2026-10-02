import type { DiscordFollowupMessage } from '@/lib/discord/bot/schema';

export type { DiscordFollowupMessage };

export async function patchDiscordWebhook({
  applicationId,
  token,
  message
}: {
  applicationId: string;
  token: string;
  message: DiscordFollowupMessage;
}): Promise<void> {
  'use step';

  await fetch(
    `https://discord.com/api/v10/webhooks/${applicationId}/${token}/messages/@original`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...(message.content !== undefined && { content: message.content }),
        ...(message.embeds !== undefined && { embeds: message.embeds }),
        ...(message.flags !== undefined && { flags: message.flags })
      })
    }
  );
}
