'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import {
  TeamPermission,
  requireMembershipPermission
} from '@giveaway/team-permissions';
import z from 'zod';

const revokeInvitation = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      slug: z.string(),
      invitationId: z.string()
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
          where: { userId: user.id },
          select: { role: true, userId: true }
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
    requireMembershipPermission(membership, TeamPermission.INVITE_MEMBERS);

    const invitation = await db.teamInviteEmail.findUnique({
      where: { id: input.invitationId }
    });

    if (!invitation || invitation.teamId !== team.id) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Invitation not found'
      });
    }

    await db.teamInviteEmail.delete({
      where: { id: input.invitationId }
    });

    return { success: true };
  });

export default revokeInvitation;
