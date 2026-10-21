'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import z from 'zod';
import { findUserTeam } from '@giveaway/team-server/find-user-team';
import { TeamPermission } from '@giveaway/team-permissions';
import { IntegrationProvider, TeamTier } from '@giveaway/db-model';
import { deleteAllEventSubSubscriptions } from '@giveaway/twitch-api/delete-eventsub-subscription';

export const disconnectTwitch = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      slug: z.string()
    })
  )
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
        teamId: team.id,
        provider: IntegrationProvider.TWITCH
      },
      include: {
        subscriptions: true
      }
    });

    if (!integration) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Twitch integration not found'
      });
    }

    if (integration.subscriptions && integration.subscriptions.length > 0) {
      try {
        await deleteAllEventSubSubscriptions(integration.subscriptions);
      } catch (error) {
        console.error('Failed to delete EventSub subscriptions:', error);
      }
    }

    await db.integration.delete({
      where: { id: integration.id }
    });

    return { success: true };
  });
