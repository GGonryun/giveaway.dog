'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import {
  TeamPermission,
  requireMembershipPermission
} from '@giveaway/team-permissions';
import { TeamRole } from '@prisma/client';
import z from 'zod';

const removeMember = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      slug: z.string(),
      membershipId: z.string()
    })
  )
  .output(
    z.object({
      success: z.boolean()
    })
  )
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
          select: {
            id: true,
            userId: true,
            role: true
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

    const currentUserMembership = team.members.find(
      (m) => m.userId === user.id
    );
    requireMembershipPermission(
      currentUserMembership,
      TeamPermission.REMOVE_MEMBERS
    );

    const targetMembership = team.members.find(
      (m) => m.id === input.membershipId
    );

    if (!targetMembership) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Member not found'
      });
    }

    if (targetMembership.role === TeamRole.OWNER) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'Cannot remove the team owner'
      });
    }

    if (team.members.length === 1) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'Cannot remove the last member of the team'
      });
    }

    await db.membership.delete({
      where: { id: input.membershipId }
    });

    return { success: true };
  });

export default removeMember;
