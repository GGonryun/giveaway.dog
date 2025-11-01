'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { findUserTeamQuery } from '@/procedures/sweepstakes/shared';
import { IntegrationProvider } from '@prisma/client';
import z from 'zod';

export const disconnectTwitter = procedure()
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

    await db.integration.deleteMany({
      where: {
        teamId: team.id,
        provider: IntegrationProvider.TWITTER
      }
    });

    return {
      success: true
    };
  });
