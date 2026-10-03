'use server';

import { z } from 'zod';
import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import { requireMembershipPermission, TeamPermission } from '@/lib/permissions';

const updateTeamName = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      slug: z.string(),
      name: z.string().min(1, 'Team name must be at least 1 character').max(100)
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
      data: { name: input.name }
    });

    return { success: true };
  });

export default updateTeamName;
