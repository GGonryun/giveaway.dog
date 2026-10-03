'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { procedure } from '@/lib/mrpc/procedures';
import { TeamPermission } from '@/lib/permissions';
import { findUserTeam } from '@/procedures/teams/find-user-team';
import {
  IntegrationProvider,
  IntegrationStatus,
  TeamTier
} from '@prisma/client';
import z from 'zod';

export const verifyDiscordInstall = procedure()
  .authorization({ required: true })
  .input(z.object({ integrationId: z.string(), slug: z.string() }))
  .handler(async ({ input, user, db }) => {
    const { team } = await findUserTeam({
      db,
      user,
      slug: input.slug,
      permission: TeamPermission.UPDATE_INTEGRATIONS,
      tier: TeamTier.FREE
    });

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
