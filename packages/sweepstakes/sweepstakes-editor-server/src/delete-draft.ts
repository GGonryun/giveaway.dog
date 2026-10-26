'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { findUserSweepstakes } from '@giveaway/sweepstakes-access/shared';
import { TeamPermission } from '@giveaway/team-permissions';
import { SweepstakesStatus, TeamTier } from '@giveaway/db-model';

const deleteDraft = procedure()
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

    if (sweepstakes.status !== SweepstakesStatus.DRAFT) {
      throw new ApplicationError({
        message: 'Only a draft can be deleted from the editor',
        code: 'CONFLICT'
      });
    }

    await db.sweepstakes.delete({
      where: {
        id: sweepstakes.id
      }
    });

    return { slug: team.slug };
  });
export default deleteDraft;
