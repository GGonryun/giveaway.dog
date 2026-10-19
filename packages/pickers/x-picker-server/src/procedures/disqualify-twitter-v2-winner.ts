'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { findUserTeam } from '@giveaway/team-server/find-user-team';
import { TeamPermission } from '@giveaway/team-permissions';
import { TeamTier } from '@giveaway/db-model';
import { ApplicationError } from '@giveaway/util-errors';

export const disqualifyTwitterV2Winner = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      drawId: z.string(),
      slug: z.string(),
      reason: z.string().min(1, 'Reason is required')
    })
  )
  .handler(async ({ db, input, user }) => {
    const { team } = await findUserTeam({
      db,
      user,
      slug: input.slug,
      permission: TeamPermission.UPDATE_PICKERS,
      tier: TeamTier.FREE
    });

    const draw = await db.twitterPickerDraw.findUnique({
      where: { id: input.drawId, picker: { teamId: team.id } }
    });

    if (!draw) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Draw not found'
      });
    }

    await db.twitterPickerDraw.update({
      where: { id: input.drawId },
      data: { disqualified: input.reason }
    });

    return { success: true };
  });
