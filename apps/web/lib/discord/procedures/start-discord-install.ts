'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { findUserTeam } from '@/procedures/teams/find-user-team';
import { TeamPermission } from '@giveaway/team-permissions';
import { TeamTier } from '@prisma/client';

export const startDiscordInstall = procedure()
  .authorization({ required: true })
  .input(z.object({ slug: z.string() }))
  .output(z.string())
  .handler(async ({ input, user, db }) => {
    const { team } = await findUserTeam({
      db,
      user,
      slug: input.slug,
      permission: TeamPermission.UPDATE_INTEGRATIONS,
      tier: TeamTier.FREE
    });

    const stateValue = {
      teamId: team.id,
      userId: user.id,
      teamSlug: team.slug
    };

    const state = await db.state.create({
      data: {
        value: stateValue
      },
      select: { id: true }
    });

    await db.integration.deleteMany({
      where: {
        teamId: team.id,
        provider: 'DISCORD',
        status: 'PENDING'
      }
    });

    await db.integration.create({
      data: {
        teamId: team.id,
        ownerId: user.id,
        provider: 'DISCORD',
        status: 'PENDING',
        stateId: state.id,
        settings: {}
      }
    });

    return state.id;
  });
