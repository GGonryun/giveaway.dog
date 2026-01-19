'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@/lib/errors';
import z from 'zod';
import { findUserTeamQuery } from '@/procedures/sweepstakes/shared';
import { datetime } from '@/lib/date';

export const startDiscordInstall = procedure()
  .authorization({ required: true })
  .input(z.object({ slug: z.string() }))
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

    await db.integration.create({
      data: {
        teamId: team.id,
        ownerId: user.id,
        provider: 'DISCORD',
        account_id: '',
        status: 'PENDING',
        stateId: state.id,
        settings: {}
      }
    });

    return state.id;
  });
