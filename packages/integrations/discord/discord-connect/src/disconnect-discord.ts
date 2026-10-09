'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { TeamPermission } from '@giveaway/team-permissions';
import { findUserTeam } from '@giveaway/team-server/find-user-team';
import { IntegrationProvider, TeamTier } from '@giveaway/db-model';
import z from 'zod';

export const disconnectDiscord = procedure('discord-connect/disconnectDiscord')
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
        provider: IntegrationProvider.DISCORD
      }
    });

    return { success: true };
  });
