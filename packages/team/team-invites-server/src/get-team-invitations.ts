'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import {
  TeamPermission,
  requireMembershipPermission
} from '@giveaway/team-permissions';
import { TeamRole } from '@giveaway/db-model';
import z from 'zod';

const getTeamInvitations = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      slug: z.string()
    })
  )
  .output(
    z.array(
      z.object({
        id: z.string(),
        email: z.string(),
        role: z.nativeEnum(TeamRole),
        createdAt: z.coerce.date()
      })
    )
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
        inviteEmails: {
          orderBy: {
            createdAt: 'desc'
          }
        },
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

    return team.inviteEmails.map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      createdAt: invite.createdAt
    }));
  });

export default getTeamInvitations;
