import 'server-only';

import { PrismaClient, TeamRole } from '@giveaway/db-model';
import { toE2eTeamSlug } from '@giveaway/e2e-model/naming';
import { toE2ePersonaUpsert } from '@giveaway/e2e-model/personas';
import { E2eTeamRequest } from '@giveaway/e2e-model/requests';
import { DEFAULT_TEAM_LOGO } from '@giveaway/team-model/team/data';
import { assertE2eOnlyTeam, E2E_TEAM_SELECT } from './ownership';

export const seedE2eTeam = async ({
  db,
  request,
  now
}: {
  db: PrismaClient;
  request: E2eTeamRequest;
  now: Date;
}) => {
  const slug = toE2eTeamSlug(request.ns, request.suffix);
  const existing = await db.team.findUnique({
    where: { slug },
    select: E2E_TEAM_SELECT
  });

  if (existing) assertE2eOnlyTeam(existing);

  const personas = [
    { persona: request.owner, role: TeamRole.OWNER },
    ...request.members
  ];

  return await db.$transaction(async (tx) => {
    const team = await tx.team.upsert({
      where: { slug },
      update: {
        tier: request.tier,
        ...(request.name && { name: request.name })
      },
      create: {
        slug,
        name: request.name ?? slug,
        tier: request.tier,
        logo: DEFAULT_TEAM_LOGO
      },
      select: { id: true, slug: true, name: true, tier: true }
    });

    const users: Record<
      string,
      { id: string; email: string | null; role: TeamRole }
    > = {};

    for (const { persona, role } of personas) {
      const user = await tx.user.upsert({
        ...toE2ePersonaUpsert({ persona, ns: request.ns, now }),
        select: { id: true, email: true }
      });

      await tx.membership.upsert({
        where: { userId_teamId: { userId: user.id, teamId: team.id } },
        update: { role },
        create: { userId: user.id, teamId: team.id, role }
      });

      users[persona] = { ...user, role };
    }

    return { created: !existing, team, users };
  });
};
