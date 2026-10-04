'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import z from 'zod';
import { findUserTeamQuery } from '@giveaway/team-server/find-user-team';
import { IntegrationProvider } from '@prisma/client';
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
