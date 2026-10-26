'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { findUserSweepstakes } from '@giveaway/sweepstakes-access/shared';
import { findUserTeam } from '@giveaway/team-server/find-user-team';
import { TeamPermission } from '@giveaway/team-permissions';
import { TeamTier } from '@giveaway/db-model';

const deleteSweepstakes = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      id: z.string()
    })
  )
  .output(
    z.object({
      slug: z.string(),
      sweepstakesSlug: z.string().nullable()
    })
  )
  .invalidate(async ({ input, output }) =>
    [input.id, output.sweepstakesSlug]
      .filter((key): key is string => !!key)
      .flatMap((key) => [`sweepstakes-${key}`, `sweepstakes-${key}-privacy`])
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
      },
      include: {
        visibility: { select: { slug: true } }
      }
    });

    if (!team.slug) {
      console.error('Failed to delete sweepstakes: Team slug is missing');
      throw new ApplicationError({
        message: 'Failed to delete sweepstakes',
        code: 'CONFLICT'
      });
    }

    return {
      slug: team.slug,
      sweepstakesSlug: deleted.visibility?.slug ?? null
    };
  });
export default deleteSweepstakes;
