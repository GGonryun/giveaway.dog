'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { findUserTeam } from '@giveaway/team-server/find-user-team';
import { IntegrationProvider, TeamTier } from '@prisma/client';
import { TeamPermission } from '@giveaway/team-permissions';

export const disconnectBluesky = procedure()
  .authorization({ required: true })
  .input(z.object({ slug: z.string() }))
  .handler(async ({ input, user, db }) => {
    const { team } = await findUserTeam({
      db,
      user,
      slug: input.slug,
      permission: TeamPermission.UPDATE_INTEGRATIONS,
      tier: TeamTier.FREE
    });

    await db.integration.deleteMany({
      where: {
        teamId: team.id,
        provider: IntegrationProvider.BLUESKY
      }
    });

    return { success: true };
  });
