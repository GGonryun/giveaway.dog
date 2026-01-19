'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { findUserTeamQuery } from '@/procedures/sweepstakes/shared';
import { IntegrationProvider } from '@prisma/client';
import z from 'zod';

export const saveDiscordSettings = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      slug: z.string(),
      integrationId: z.string(),
      channelId: z.string(),
      channelName: z.string(),
      notifyOnNewGiveaway: z.boolean()
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

    const currentSettings = (integration.settings as any) || {};

    await db.integration.update({
      where: { id: integration.id },
      data: {
        settings: {
          ...currentSettings,
          channelId: input.channelId,
          channelName: input.channelName,
          notifyOnNewGiveaway: input.notifyOnNewGiveaway
        }
      }
    });

    return { success: true };
  });
