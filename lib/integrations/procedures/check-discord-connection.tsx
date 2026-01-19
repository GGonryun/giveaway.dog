'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@/lib/errors';
import z from 'zod';
import { findUserTeamQuery } from '@/procedures/sweepstakes/shared';
import { IntegrationProvider, IntegrationStatus } from '@prisma/client';
import { discordIntegrationSettingsSchema } from '../schemas/discord';

export const checkDiscordConnection = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      slug: z.string(),
      stateId: z.string()
    })
  )
  .output(
    z.object({
      isConnected: z.boolean(),
      channelId: z.string().optional(),
      channelName: z.string().optional(),
      errorMessage: z.string().optional()
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
        stateId: input.stateId,
        teamId: team.id,
        provider: IntegrationProvider.DISCORD
      }
    });

    if (!integration) {
      return {
        isConnected: false,
        errorMessage: 'Integration not found. Please try reconnecting.'
      };
    }

    const settingsResult = discordIntegrationSettingsSchema.safeParse(
      integration.settings
    );

    if (!settingsResult.success) {
      return {
        isConnected: false,
        errorMessage: 'Invalid integration settings. Please reconnect.'
      };
    }

    const settings = settingsResult.data;

    if (
      settings.registrationKeyExpiry &&
      new Date(settings.registrationKeyExpiry) < new Date()
    ) {
      return {
        isConnected: false,
        errorMessage: 'Registration key expired (24 hours). Please reconnect.'
      };
    }

    if (integration.status === IntegrationStatus.ACTIVE) {
      return {
        isConnected: true,
        channelId: settings.channelId,
        channelName: settings.channelName
      };
    }

    return {
      isConnected: false,
      errorMessage: 'Bot not activated yet. Run /connect in your Discord server.'
    };
  });
