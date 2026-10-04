'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import {
  TeamPermission,
  requireMembershipPermission
} from '@giveaway/team-permissions';
import { TeamRole } from '@giveaway/db-model';
import { newEmailClient, NO_REPLY_EMAIL } from '@giveaway/email/client';
import { getTeamInviteEmailContent } from '@giveaway/email/templates';
import { environment } from '@giveaway/app-config/environment';
import z from 'zod';

const inviteMembersSchema = z.object({
  slug: z.string(),
  invitations: z.array(
    z.object({
      email: z.string().email('Invalid email address'),
      role: z.nativeEnum(TeamRole)
    })
  )
});

const inviteMembers = procedure()
  .authorization({ required: true })
  .input(inviteMembersSchema)
  .output(
    z.object({
      success: z.boolean(),
      invited: z.array(z.string()),
      skipped: z.array(
        z.object({
          email: z.string(),
          reason: z.string()
        })
      )
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
        name: true,
        slug: true,
        logo: true,
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

    const invited: string[] = [];
    const skipped: Array<{ email: string; reason: string }> = [];

    for (const invitation of input.invitations) {
      const existingUser = await db.user.findUnique({
        where: { email: invitation.email },
        select: {
          id: true,
          teams: {
            where: { teamId: team.id },
            select: { id: true }
          }
        }
      });

      if (existingUser && existingUser.teams.length > 0) {
        skipped.push({
          email: invitation.email,
          reason: 'User is already a member of this team'
        });
        continue;
      }

      const existingInvite = await db.teamInviteEmail.findUnique({
        where: {
          teamId_email: {
            teamId: team.id,
            email: invitation.email
          }
        }
      });

      if (existingInvite) {
        skipped.push({
          email: invitation.email,
          reason: 'Invitation already sent to this email'
        });
        continue;
      }

      const inviteRecord = await db.teamInviteEmail.create({
        data: {
          teamId: team.id,
          email: invitation.email,
          role: invitation.role
        }
      });

      try {
        const baseUrl = environment.appUrl();
        const inviteUrl = `${baseUrl}/invites/${inviteRecord.id}`;

        const emailClient = newEmailClient({
          secret: process.env.INBOUND_SECRET
        });

        await emailClient.send({
          from: NO_REPLY_EMAIL,
          to: invitation.email,
          ...getTeamInviteEmailContent({
            teamName: team.name,
            teamLogo: team.logo,
            inviterName: user.name || undefined,
            role: invitation.role,
            inviteUrl,
            recipientEmail: invitation.email
          })
        });

        invited.push(invitation.email);
      } catch (error) {
        console.error('Failed to send invitation email:', error);
        await db.teamInviteEmail.delete({
          where: { id: inviteRecord.id }
        });
        skipped.push({
          email: invitation.email,
          reason: 'Failed to send invitation email'
        });
      }
    }

    return {
      success: true,
      invited,
      skipped
    };
  });

export default inviteMembers;
