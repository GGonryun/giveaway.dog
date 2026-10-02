'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { TeamPermission } from '@/lib/permissions';
import { findUserTeam } from '@/procedures/teams/find-user-team';
import { IntegrationProvider, TeamTier } from '@prisma/client';
import z from 'zod';

export const getDiscordRoles = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      slug: z.string(),
      integrationId: z.string()
    })
  )
  .output(
    z.object({
      roles: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          color: z.number(),
          position: z.number()
        })
      )
    })
  )
  .handler(async ({ input, user, db }) => {
    const { team } = await findUserTeam({
      db,
      user,
      slug: input.slug,
      permission: TeamPermission.VIEW_INTEGRATIONS,
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
        message: 'Discord integration not found'
      });
    }

    const guildId = integration.account_id;

    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/roles`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
        }
      }
    );

    if (!response.ok) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch Discord roles'
      });
    }

    const allRoles = await response.json();

    const roles = allRoles
      .filter((role: any) => role.name !== '@everyone')
      .map((role: any) => ({
        id: role.id,
        name: role.name,
        color: role.color,
        position: role.position
      }))
      .sort((a: any, b: any) => b.position - a.position);

    return { roles };
  });
