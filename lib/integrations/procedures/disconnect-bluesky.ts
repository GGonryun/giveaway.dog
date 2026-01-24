'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { findUserTeam } from '@/procedures/sweepstakes/shared';
import { IntegrationProvider } from '@prisma/client';
import { TeamPermission } from '@/lib/permissions';

export const disconnectBluesky = procedure()
  .authorization({ required: true })
  .input(z.object({ slug: z.string() }))
  .handler(async ({ input, user, db }) => {
    const { team } = await findUserTeam({
      db,
      user,
      slug: input.slug,
      permission: TeamPermission.UPDATE_INTEGRATIONS
    });

    await db.integration.deleteMany({
      where: {
        teamId: team.id,
        provider: IntegrationProvider.BLUESKY
      }
    });

    return { success: true };
  });
