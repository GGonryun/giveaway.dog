'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@/lib/errors';
import { TeamRole } from '@prisma/client';
import z from 'zod';

const getInviteDetails = procedure()
  .authorization({ required: false })
  .input(
    z.object({
      code: z.string()
    })
  )
  .output(
    z.object({
      teamName: z.string(),
      teamLogo: z.string(),
      teamSlug: z.string(),
      role: z.nativeEnum(TeamRole).nullable(),
      isEmailInvite: z.boolean()
    })
  )
  .handler(async ({ db, input }) => {
    const inviteLink = await db.teamInviteLink.findUnique({
      where: { id: input.code },
      include: { team: { select: { name: true, logo: true, slug: true } } }
    });

    if (inviteLink) {
      return {
        teamName: inviteLink.team.name,
        teamLogo: inviteLink.team.logo,
        teamSlug: inviteLink.team.slug,
        role: null,
        isEmailInvite: false
      };
    }

    const emailInvite = await db.teamInviteEmail.findFirst({
      where: { id: input.code },
      include: { team: { select: { name: true, logo: true, slug: true } } }
    });

    if (emailInvite) {
      return {
        teamName: emailInvite.team.name,
        teamLogo: emailInvite.team.logo,
        teamSlug: emailInvite.team.slug,
        role: emailInvite.role,
        isEmailInvite: true
      };
    }

    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: 'Invalid or expired invitation'
    });
  });

export default getInviteDetails;
