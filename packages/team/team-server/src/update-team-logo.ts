'use server';

import { z } from 'zod';
import { procedure } from '@giveaway/rpc-server/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import {
  requireMembershipPermission,
  TeamPermission
} from '@giveaway/team-permissions';

const updateTeamLogo = procedure('team-server/updateTeamLogo')
  .authorization({ required: true })
  .input(
    z.object({
      slug: z.string(),
      logo: z
        .string()
        .min(1, 'Team logo URL is required')
        .url('Team logo must be a valid URL')
    })
  )
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ db, user, input }) => {
    const team = await db.team.findFirst({
      where: {
        slug: input.slug,
        members: {
          some: {
            userId: user.id
          }
        }
      },
      select: {
        id: true,
        members: {
          where: {
            userId: user.id
          }
        }
      }
    });

    if (!team) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Team not found'
      });
    }

    const membership = team.members[0];
    requireMembershipPermission(membership, TeamPermission.MANAGE_ROLES);

    await db.team.update({
      where: { id: team.id },
      data: { logo: input.logo }
    });

    return { success: true };
  });

export default updateTeamLogo;
