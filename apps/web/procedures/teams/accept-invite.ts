'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import { TeamRole, UserAccountType } from '@prisma/client';
import z from 'zod';

const acceptInvite = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      code: z.string()
    })
  )
  .output(
    z.object({
      teamSlug: z.string(),
      teamName: z.string()
    })
  )
  .handler(async ({ db, user, input }) => {
    const inviteLink = await db.teamInviteLink.findUnique({
      where: { id: input.code },
      include: { team: true }
    });

    const emailInvite = await db.teamInviteEmail.findFirst({
      where: {
        id: input.code
      },
      include: { team: true }
    });

    const invite = inviteLink || emailInvite;

    if (!invite) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Invalid or expired invitation'
      });
    }

    if (emailInvite && user.email !== emailInvite.email) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message:
          'This invitation was sent to a different email address. Please log in with the correct account.'
      });
    }

    const existingMembership = await db.membership.findFirst({
      where: {
        userId: user.id,
        teamId: invite.team.id
      }
    });

    if (existingMembership) {
      throw new ApplicationError({
        code: 'CONFLICT',
        message: 'You are already a member of this team'
      });
    }

    let role: TeamRole = TeamRole.MEMBER;

    if (emailInvite) {
      role = emailInvite.role;
    }

    await db.$transaction(async (tx) => {
      await tx.membership.create({
        data: {
          userId: user.id,
          teamId: invite.team.id,
          role
        }
      });

      await tx.user.update({
        where: { id: user.id },
        data: { accountType: UserAccountType.HOST }
      });

      if (emailInvite) {
        await tx.teamInviteEmail.delete({
          where: { id: emailInvite.id }
        });
      }
    });

    return {
      teamSlug: invite.team.slug,
      teamName: invite.team.name
    };
  });

export default acceptInvite;
