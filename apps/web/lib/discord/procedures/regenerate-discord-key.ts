'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { TeamPermission } from '@/lib/permissions';
import { findUserTeam } from '@/procedures/sweepstakes/shared';
import { TeamTier } from '@prisma/client';
import z from 'zod';

export const regenerateDiscordKey = procedure()
  .authorization({ required: true })
  .input(z.object({ integrationId: z.string(), slug: z.string() }))
  .output(z.string())
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
        id: input.integrationId
      }
    });

    // delete old state if exists
    if (integration?.stateId) {
      await db.state.delete({
        where: {
          id: integration.stateId
        }
      });
    }

    const newState = await db.state.create({
      data: {
        value: {
          teamId: team.id,
          userId: user.id,
          teamSlug: team.slug
        }
      },
      select: { id: true }
    });

    await db.integration.update({
      where: { id: input.integrationId },
      data: {
        stateId: newState.id
      }
    });

    return newState.id;
  });
