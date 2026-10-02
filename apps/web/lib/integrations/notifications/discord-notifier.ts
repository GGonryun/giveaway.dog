'use server';

import prisma from '@/lib/prisma';
import { IntegrationProvider, IntegrationStatus } from '@prisma/client';
import { DiscordIntegrationSettings } from '../schemas/discord';

export async function notifyDiscordNewGiveaway(
  teamId: string,
  giveaway: {
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
    endsAt: Date;
  }
) {
  const integrations = (await prisma.integration.findMany({
    where: {
      teamId,
      provider: IntegrationProvider.DISCORD,
      status: IntegrationStatus.ACTIVE
    }
  })) as any[];

  for (const integration of integrations) {
    const settings = integration.settings as DiscordIntegrationSettings;

    if (!settings.notifyOnNewGiveaway || !settings.channelId) {
      continue;
    }

    try {
      await sendDiscordMessage(settings.channelId, {
        embeds: [
          {
            title: '🎉 New Giveaway Posted!',
            description: giveaway.description,
            url: giveaway.url,
            color: 0x5865f2,
            fields: [
              {
                name: 'Title',
                value: giveaway.title,
                inline: false
              },
              {
                name: 'Ends',
                value: `<t:${Math.floor(giveaway.endsAt.getTime() / 1000)}:R>`,
                inline: true
              }
            ],
            image: giveaway.imageUrl
              ? {
                  url: giveaway.imageUrl
                }
              : undefined,
            footer: {
              text: 'Click the title to enter!'
            }
          }
        ]
      });
    } catch (error) {
      console.error('Failed to send Discord notification:', error);

      await prisma.integration.update({
        where: { id: integration.id },
        data: { status: IntegrationStatus.ERROR }
      });
    }
  }
}

async function sendDiscordMessage(channelId: string, content: any) {
  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(content)
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Discord API error: ${response.status} ${errorData}`);
  }

  return response.json();
}
