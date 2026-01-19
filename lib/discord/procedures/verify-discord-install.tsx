'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { findUserTeamQuery } from '@/procedures/sweepstakes/shared';
import { IntegrationProvider, IntegrationStatus } from '@prisma/client';
import z from 'zod';

export const verifyDiscordInstall = procedure()
  .authorization({ required: true })
  .input(z.object({ integrationId: z.string(), slug: z.string() }))
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
        message: 'Integration not found'
      });
    }

    if (integration.status !== IntegrationStatus.ACTIVE) {
      throw new ApplicationError({
        code: 'CONFLICT',
        message:
          'Integration is not active. Are you sure you completed the installation?'
      });
    }

    return { success: true };
  });
