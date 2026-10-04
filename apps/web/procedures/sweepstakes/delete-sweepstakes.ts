'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { findUserSweepstakes } from './shared';
import { findUserTeam } from '@/procedures/teams/find-user-team';
import { TeamPermission } from '@giveaway/team-permissions';
import { TeamTier } from '@prisma/client';

const deleteSweepstakes = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      id: z.string()
    })
  )
  .output(
    z.object({
      slug: z.string()
    })
  )

  .handler(async ({ input, db, user }) => {
    const { team, sweepstakes } = await findUserSweepstakes({
      db,
      user,
      id: input.id,
      permission: TeamPermission.DELETE_SWEEPSTAKES,
      tier: TeamTier.FREE
    });

    // TODO: when deleting a draft there may be extra resources such as images that need to get removed from vercel storage.
    const deleted = await db.sweepstakes.delete({
      where: {
        id: sweepstakes.id
      }
    });

    if (!team.slug) {
      console.error('Failed to delete sweepstakes: Team slug is missing');
      throw new ApplicationError({
        message: 'Failed to delete sweepstakes',
        code: 'CONFLICT'
      });
    }

    return { slug: team.slug };
  });
export default deleteSweepstakes;
