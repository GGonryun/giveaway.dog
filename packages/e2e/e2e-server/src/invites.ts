import 'server-only';

import { PrismaClient } from '@giveaway/db-model';
import {
  E2eInvitesRequest,
  toE2eUserNamespace
} from '@giveaway/e2e-model/extras';
import { toE2ePersonaEmail } from '@giveaway/e2e-model/personas';
import { findE2eTeam } from './ownership';

export const seedE2eInvites = async ({
  db,
  request,
  now
}: {
  db: PrismaClient;
  request: E2eInvitesRequest;
  now: Date;
}) => {
  const team = await findE2eTeam(db, request.team);
  const emails = request.emails.map((invite) => ({
    email: toE2ePersonaEmail(
      invite.persona,
      toE2eUserNamespace(request, invite)
    ),
    role: invite.role
  }));

  return await db.$transaction(async (tx) => {
    const invites = [];
    for (const { email, role } of emails) {
      invites.push(
        await tx.teamInviteEmail.upsert({
          where: { teamId_email: { teamId: team.id, email } },
          update: { role },
          create: { teamId: team.id, email, role },
          select: { id: true, email: true, role: true }
        })
      );
    }

    const expiresAt =
      request.link?.expiresIn == null
        ? null
        : new Date(now.getTime() + request.link.expiresIn * 1000);
    const link = request.link
      ? await tx.teamInviteLink.upsert({
          where: { teamId: team.id },
          update: { expiresAt },
          create: { teamId: team.id, expiresAt },
          select: { id: true, expiresAt: true }
        })
      : null;

    return { team: team.slug, emails: invites, link };
  });
};
