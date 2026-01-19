'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { findUserTeamQuery } from '@/procedures/sweepstakes/shared';
import { IntegrationProvider } from '@prisma/client';
import z from 'zod';

export const getDiscordChannels = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      slug: z.string(),
      integrationId: z.string()
    })
  )
  .output(
    z.object({
      channels: z.array(
        z.object({
          id: z.string(),
          name: z.string()
        })
      )
    })
  )
  .handler(async ({ input, user, db }) => {
    const team = await db.team.findUnique({
      where: findUserTeamQuery({ slug: input.slug, userId: user.id })
    });

    if (!team) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Team not found'
      });
    }

    const integration = await db.integration.findFirst({
      where: {
        id: input.integrationId,
        teamId: team.id,
        provider: IntegrationProvider.DISCORD
      }
    });

    if (!integration) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Discord integration not found'
      });
    }

    const guildId = integration.account_id;

    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
        }
      }
    );

    if (!response.ok) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch Discord channels'
      });
    }

    const allChannels = await response.json();

    const textChannels = allChannels
      .filter((channel: any) => channel.type === 0)
      .map((channel: any) => ({
        id: channel.id,
        name: channel.name
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    return { channels: textChannels };
  });
