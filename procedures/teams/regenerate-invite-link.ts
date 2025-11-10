'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@/lib/errors';
import { TeamPermission, requireMembershipPermission } from '@/lib/permissions';
import { environment } from '@/lib/environment';
import z from 'zod';

const regenerateInviteLink = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      slug: z.string()
    })
  )
  .output(
    z.object({
      code: z.string(),
      url: z.string(),
      expiresAt: z.date().nullable()
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
        slug: true,
        inviteLink: true,
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
    requireMembershipPermission(membership, TeamPermission.MANAGE_INVITE_LINK);

    if (team.inviteLink) {
      await db.teamInviteLink.delete({
        where: { id: team.inviteLink.id }
      });
    }

    const newInviteLink = await db.teamInviteLink.create({
      data: {
        teamId: team.id
      }
    });

    const baseUrl = environment.appUrl();
    const url = `${baseUrl}/invites/${newInviteLink.id}`;

    return {
      code: newInviteLink.id,
      url,
      expiresAt: newInviteLink.expiresAt
    };
  });

export default regenerateInviteLink;
