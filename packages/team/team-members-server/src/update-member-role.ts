'use server';

import { z } from 'zod';
import { procedure } from '@giveaway/rpc-server/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import { TeamRole } from '@giveaway/db-model';
import {
  requireMembershipPermission,
  TeamPermission
} from '@giveaway/team-permissions';

const updateMemberRole = procedure('team-members-server/updateMemberRole')
  .authorization({ required: true })
  .input(
    z.object({
      slug: z.string(),
      membershipId: z.string(),
      role: z.nativeEnum(TeamRole)
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

    const targetMembership = await db.membership.findFirst({
      where: {
        id: input.membershipId,
        teamId: team.id
      },
      include: {
        user: true
      }
    });

    if (!targetMembership) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Member not found'
      });
    }

    if (
      targetMembership.role === TeamRole.OWNER &&
      input.role !== TeamRole.OWNER
    ) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'Cannot change the owner role. Transfer ownership first.'
      });
    }

    if (input.role === TeamRole.OWNER && membership.role !== TeamRole.OWNER) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'Only the current owner can transfer ownership'
      });
    }

    if (
      input.role === TeamRole.OWNER &&
      targetMembership.role !== TeamRole.OWNER
    ) {
      const currentOwner = await db.membership.findFirst({
        where: {
          teamId: team.id,
          role: TeamRole.OWNER
        }
      });

      if (currentOwner) {
        await db.membership.update({
          where: { id: currentOwner.id },
          data: { role: TeamRole.ADMIN }
        });
      }
    }

    await db.membership.update({
      where: { id: input.membershipId },
      data: { role: input.role }
    });

    return { success: true };
  });

export default updateMemberRole;
