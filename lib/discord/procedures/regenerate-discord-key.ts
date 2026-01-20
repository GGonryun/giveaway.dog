'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { findUserTeamQuery } from '@/procedures/sweepstakes/shared';
import { IntegrationProvider } from '@prisma/client';
import z from 'zod';

export const regenerateDiscordKey = procedure()
  .authorization({ required: true })
  .input(z.object({ integrationId: z.string(), slug: z.string() }))
  .output(z.string())
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
