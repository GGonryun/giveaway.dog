import 'server-only';

import { Prisma, PrismaClient } from '@giveaway/db-model';
import { isE2eTeamSlug } from '@giveaway/e2e-model/naming';
import { isE2eEmail } from '@giveaway/e2e-model/personas';
import { ApplicationError } from '@giveaway/util-errors';

export const E2E_TEAM_SELECT = {
  id: true,
  slug: true,
  name: true,
  tier: true,
  createdAt: true,
  members: {
    select: {
      role: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          username: true,
          onboarded: true,
          accountType: true
        }
      }
    }
  }
} satisfies Prisma.TeamSelect;

type TeamMembers = {
  slug: string;
  members: { user: { email: string | null } }[];
};

type WithE2eEmails<T extends TeamMembers> = {
  members: (T['members'][number] & { user: { email: string } })[];
};

type E2eTeamRow = Prisma.TeamGetPayload<{
  select: typeof E2E_TEAM_SELECT;
}>;

export type E2eTeam = Omit<E2eTeamRow, 'members'> & WithE2eEmails<E2eTeamRow>;

export const isE2eOnlyTeam = (team: TeamMembers) =>
  isE2eTeamSlug(team.slug) &&
  team.members.every((member) => isE2eEmail(member.user.email));

export function assertE2eOnlyTeam<T extends TeamMembers>(
  team: T
): asserts team is T & WithE2eEmails<T> {
  if (!isE2eOnlyTeam(team)) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: `Team ${team.slug} has a member who is not an e2e user`
    });
  }
}

export const findE2eTeam = async (
  db: PrismaClient,
  slug: string
): Promise<E2eTeam> => {
  const team = isE2eTeamSlug(slug)
    ? await db.team.findUnique({ where: { slug }, select: E2E_TEAM_SELECT })
    : null;

  if (!team) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: `Team ${slug} not found`
    });
  }

  assertE2eOnlyTeam(team);
  return team;
};

export const findE2eSweepstakesId = async (db: PrismaClient, id: string) => {
  const sweepstakes = await db.sweepstakes.findUnique({
    where: { id },
    select: {
      id: true,
      team: {
        select: {
          slug: true,
          members: { select: { user: { select: { email: true } } } }
        }
      }
    }
  });

  if (!sweepstakes?.team || !isE2eOnlyTeam(sweepstakes.team)) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: `Sweepstakes ${id} not found`
    });
  }

  return sweepstakes.id;
};
