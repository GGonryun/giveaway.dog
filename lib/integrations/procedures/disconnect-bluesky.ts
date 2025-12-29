'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@/lib/errors';
import z from 'zod';
import { findUserTeamQuery } from '@/procedures/sweepstakes/shared';
import { IntegrationProvider } from '@prisma/client';

export const disconnectBluesky = procedure()
  .authorization({ required: true })
  .input(z.object({ slug: z.string() }))
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

    await db.integration.deleteMany({
      where: {
        teamId: team.id,
        provider: IntegrationProvider.BLUESKY
      }
    });

    return { success: true };
  });
