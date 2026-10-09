'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import {
  TeamPermission,
  requireMembershipPermission
} from '@giveaway/team-permissions';
import { environment } from '@giveaway/app-config/environment';
import z from 'zod';

const getInviteLink = procedure('team-invites-server/getInviteLink')
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
      expiresAt: z.coerce.date().nullable()
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

    let inviteLink = team.inviteLink;

    if (!inviteLink) {
      inviteLink = await db.teamInviteLink.create({
        data: {
          teamId: team.id
        }
      });
    }

    const baseUrl = environment.appUrl();
    const url = `${baseUrl}/invites/${inviteLink.id}`;

    return {
      code: inviteLink.id,
      url,
      expiresAt: inviteLink.expiresAt
    };
  });

export default getInviteLink;
