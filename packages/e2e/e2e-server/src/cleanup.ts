import 'server-only';

import { Prisma, PrismaClient } from '@giveaway/db-model';
import {
  E2E_TEAM_SLUG_PREFIX,
  isE2eNamespaceOfRun,
  isE2eTeamSlug,
  toE2eRunTeamSlugPrefix
} from '@giveaway/e2e-model/naming';
import {
  E2E_SHARED_HOST_EMAIL,
  toE2eNamespaceOfEmail
} from '@giveaway/e2e-model/personas';
import { expireE2eSweepstakesTags } from './cache';
import { isE2eOnlyTeam } from './ownership';
import { deleteOrphanE2eIpAddresses } from './users';

export const E2E_TEAM_BATCH = 100;
export const E2E_USER_BATCH = 200;
export const E2E_JANITOR_AGE_MS = 24 * 60 * 60 * 1000;

const deleteE2eTeams = async (
  db: PrismaClient,
  where: Prisma.TeamWhereInput
) => {
  const found = await db.team.findMany({
    where: { AND: [{ slug: { startsWith: E2E_TEAM_SLUG_PREFIX } }, where] },
    select: {
      id: true,
      slug: true,
      members: { select: { user: { select: { email: true } } } },
      sweepstakes: { select: { id: true } }
    },
    orderBy: { createdAt: 'asc' },
    take: E2E_TEAM_BATCH + 1
  });
  const batch = found.slice(0, E2E_TEAM_BATCH);
  const owned = batch.filter(isE2eOnlyTeam);
  const refused = batch.filter((team) => !isE2eOnlyTeam(team));
  const ids = owned.map((team) => team.id);

  if (ids.length > 0) {
    await db.$transaction([
      db.twitterPickerDraw.deleteMany({
        where: { picker: { teamId: { in: ids } } }
      }),
      db.team.deleteMany({ where: { id: { in: ids } } })
    ]);
  }

  return {
    deleted: owned.map((team) => team.slug),
    refused: refused.map((team) => team.slug),
    sweepstakesIds: owned.flatMap((team) => team.sweepstakes.map((s) => s.id)),
    more: found.length > E2E_TEAM_BATCH
  };
};

const deleteE2eUsers = async (
  db: PrismaClient,
  where: Prisma.UserWhereInput,
  accept: (ns: string) => boolean
) => {
  const found = await db.user.findMany({
    where: {
      AND: [
        { email: { startsWith: 'e2e-', endsWith: '@example.com' } },
        { NOT: { email: E2E_SHARED_HOST_EMAIL } },
        where
      ]
    },
    select: {
      id: true,
      email: true,
      teams: { select: { team: { select: { slug: true } } } }
    },
    orderBy: { createdAt: 'asc' },
    take: E2E_USER_BATCH + 1
  });
  const candidates = found.slice(0, E2E_USER_BATCH).filter((user) => {
    const ns = toE2eNamespaceOfEmail(user.email);
    return ns !== undefined && accept(ns);
  });
  const isOwned = (user: (typeof candidates)[number]) =>
    user.teams.every((membership) => isE2eTeamSlug(membership.team.slug));
  const owned = candidates.filter(isOwned);
  const refused = candidates.filter((user) => !isOwned(user));

  if (owned.length > 0) {
    await db.user.deleteMany({
      where: { id: { in: owned.map((user) => user.id) } }
    });
    await deleteOrphanE2eIpAddresses(db);
  }

  return {
    deleted: owned.length,
    refused: refused.map((user) => user.email),
    more: found.length > E2E_USER_BATCH
  };
};

const deleteE2eData = async (
  db: PrismaClient,
  {
    teams: teamWhere,
    users: userWhere,
    accept
  }: {
    teams: Prisma.TeamWhereInput;
    users: Prisma.UserWhereInput;
    accept: (ns: string) => boolean;
  }
) => {
  const { sweepstakesIds, ...teams } = await deleteE2eTeams(db, teamWhere);
  const users = await deleteE2eUsers(db, userWhere, accept);

  if (sweepstakesIds.length > 0) {
    expireE2eSweepstakesTags(sweepstakesIds, { lists: true });
  }

  return {
    teams: { deleted: teams.deleted, refused: teams.refused },
    sweepstakes: { deleted: sweepstakesIds.length },
    users: { deleted: users.deleted, refused: users.refused },
    more: teams.more || users.more
  };
};

export const deleteE2eRun = async ({
  db,
  runId
}: {
  db: PrismaClient;
  runId: string;
}) => ({
  runId,
  ...(await deleteE2eData(db, {
    teams: { slug: { startsWith: toE2eRunTeamSlugPrefix(runId) } },
    users: { email: { contains: `-${runId}` } },
    accept: (ns) => isE2eNamespaceOfRun(ns, runId)
  }))
});

export const sweepE2eData = async ({
  db,
  now
}: {
  db: PrismaClient;
  now: Date;
}) => {
  const before = new Date(now.getTime() - E2E_JANITOR_AGE_MS);
  return {
    before,
    ...(await deleteE2eData(db, {
      teams: { createdAt: { lt: before } },
      users: { createdAt: { lt: before } },
      accept: () => true
    }))
  };
};
