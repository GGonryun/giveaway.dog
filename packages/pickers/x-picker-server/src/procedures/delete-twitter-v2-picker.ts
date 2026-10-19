'use server';
import { getWorld } from 'workflow/runtime';
import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { findUserTeam } from '@giveaway/team-server/find-user-team';
import { TeamPermission } from '@giveaway/team-permissions';
import { TeamTier } from '@giveaway/db-model';

export const deleteTwitterV2Picker = procedure()
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

    const data = await db.twitterPicker.delete({
      where: {
        id: pickerId,
        teamId: team.id
      }
    });

    if (data.runId) {
      const world = getWorld();
      await world.runs.cancel(data.runId);
    }

    return data;
  });
