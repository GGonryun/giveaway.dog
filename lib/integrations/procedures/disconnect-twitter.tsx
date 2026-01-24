'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { TeamPermission } from '@/lib/permissions';
import { findUserTeam } from '@/procedures/sweepstakes/shared';
import { IntegrationProvider } from '@prisma/client';
import z from 'zod';

export const disconnectTwitter = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      slug: z.string(),
      integrationId: z.string()
    })
  )
  .handler(async ({ input, user, db }) => {
    const { team } = await findUserTeam({
      db,
      user,
      slug: input.slug,
      permission: TeamPermission.UPDATE_INTEGRATIONS
    });

    await db.integration.delete({
      where: {
        id: input.integrationId,
        teamId: team.id,
        provider: IntegrationProvider.TWITTER
      }
    });

    return {
      success: true
    };
  });
