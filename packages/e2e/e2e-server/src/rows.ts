import 'server-only';

import { PrismaClient } from '@giveaway/db-model';
import { isE2eEmail } from '@giveaway/e2e-model/personas';
import { E2eRowsQuery } from '@giveaway/e2e-model/requests';
import { assertNever } from '@giveaway/util-errors';
import { findE2eSweepstakesId, findE2eTeam } from './ownership';

const MAX_ROWS = 500;

const readTeam = async (db: PrismaClient, slug: string) => {
  const { members, ...team } = await findE2eTeam(db, slug);
  return {
    team,
    members: members.map(({ role, user }) => ({
      userId: user.id,
      email: user.email,
      role
    }))
  };
};

const readSweepstakes = async (db: PrismaClient, id: string) => {
  await findE2eSweepstakesId(db, id);
  const sweepstakes = await db.sweepstakes.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      status: true,
      createdAt: true,
      team: { select: { slug: true } },
      details: { select: { name: true } },
      timing: { select: { startDate: true, endDate: true, timeZone: true } },
      visibility: { select: { visibility: true, slug: true } },
      _count: { select: { participants: true, tasks: true, prizes: true } }
    }
  });
  return { sweepstakes };
};

const readParticipants = async (db: PrismaClient, id: string) => {
  const sweepstakesId = await findE2eSweepstakesId(db, id);
  const participants = await db.sweepstakesParticipant.findMany({
    where: { sweepstakesId },
    select: {
      id: true,
      createdAt: true,
      user: { select: { id: true, email: true } },
      _count: { select: { taskCompletions: true } }
    },
    orderBy: { createdAt: 'asc' },
    take: MAX_ROWS
  });
  return {
    participants: participants.map(({ user, _count, ...participant }) => ({
      ...participant,
      userId: user.id,
      email: isE2eEmail(user.email) ? user.email : null,
      completions: _count.taskCompletions
    }))
  };
};

const readJobs = async (db: PrismaClient, id: string) => {
  const sweepstakesId = await findE2eSweepstakesId(db, id);
  const jobs = await db.sweepstakesJob.findMany({
    where: { sweepstakesId },
    select: { type: true, status: true, runAt: true },
    orderBy: { type: 'asc' },
    take: MAX_ROWS
  });
  return { jobs };
};

export const readE2eRows = ({
  db,
  query
}: {
  db: PrismaClient;
  query: E2eRowsQuery;
}) => {
  switch (query.view) {
    case 'team':
      return readTeam(db, query.slug);
    case 'sweepstakes':
      return readSweepstakes(db, query.id);
    case 'participants':
      return readParticipants(db, query.id);
    case 'jobs':
      return readJobs(db, query.id);
    default:
      return assertNever(query);
  }
};
