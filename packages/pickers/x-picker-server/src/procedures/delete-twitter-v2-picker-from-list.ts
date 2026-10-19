'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { findUserTeam } from '@giveaway/team-server/find-user-team';
import { TeamPermission } from '@giveaway/team-permissions';
import { TeamTier } from '@giveaway/db-model';

export const deleteTwitterV2PickerFromList = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      pickerId: z.string(),
      slug: z.string()
    })
  )
  .handler(async ({ input: { pickerId, slug }, db, user }) => {
    const { team } = await findUserTeam({
      db,
      user,
      slug,
      permission: TeamPermission.UPDATE_PICKERS,
      tier: TeamTier.FREE
    });

    return await db.twitterPicker.deleteMany({
      where: {
        id: pickerId,
        teamId: team.id
      }
    });
  });
