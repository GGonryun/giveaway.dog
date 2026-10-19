import 'server-only';

import { PrismaClient } from '@giveaway/db-model';
import { isE2eEmail, toE2ePersonaEmail } from '@giveaway/e2e-model/personas';
import { E2eRowsQuery } from '@giveaway/e2e-model/requests';
import { assertNever } from '@giveaway/util-errors';
import { ApplicationError } from '@giveaway/util-errors';
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

const toE2eEmail = (email: string | null) => (isE2eEmail(email) ? email : null);

const countBy = <T extends string>(values: T[]) =>
  values.reduce<Partial<Record<T, number>>>(
    (counts, value) => ({ ...counts, [value]: (counts[value] ?? 0) + 1 }),
    {}
  );

const readCompletions = async (db: PrismaClient, id: string) => {
  const sweepstakesId = await findE2eSweepstakesId(db, id);
  const completions = await db.taskCompletion.findMany({
    where: { task: { sweepstakesId } },
    select: {
      id: true,
      taskId: true,
      status: true,
      reason: true,
      completedAt: true,
      participant: {
        select: { id: true, user: { select: { id: true, email: true } } }
      }
    },
    orderBy: [{ completedAt: 'asc' }, { id: 'asc' }],
    take: MAX_ROWS
  });
  return {
    byStatus: countBy(completions.map((completion) => completion.status)),
    completions: completions.map(({ participant, ...completion }) => ({
      ...completion,
      participantId: participant.id,
      userId: participant.user.id,
      email: toE2eEmail(participant.user.email)
    }))
  };
};

const readDraws = async (db: PrismaClient, id: string) => {
  const sweepstakesId = await findE2eSweepstakesId(db, id);
  const draws = await db.prizeDraw.findMany({
    where: { prize: { sweepstakesId } },
    select: {
      id: true,
      prizeId: true,
      result: true,
      disqualificationReason: true,
      previousDrawId: true,
      createdAt: true,
      taskCompletion: {
        select: {
          id: true,
          participant: {
            select: { id: true, user: { select: { id: true, email: true } } }
          }
        }
      }
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: MAX_ROWS
  });
  return {
    byResult: countBy(draws.map((draw) => draw.result)),
    draws: draws.map(({ taskCompletion, ...draw }) => ({
      ...draw,
      completionId: taskCompletion.id,
      participantId: taskCompletion.participant.id,
      userId: taskCompletion.participant.user.id,
      email: toE2eEmail(taskCompletion.participant.user.email)
    }))
  };
};

const readAccounts = async (
  db: PrismaClient,
  persona: E2eRowsQuery & { view: 'accounts' }
) => {
  const email = toE2ePersonaEmail(persona.persona, persona.ns);
  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      source: true,
      emailVerified: true,
      accounts: {
        select: {
          provider: true,
          providerAccountId: true,
          status: true,
          scope: true,
          label: true
        },
        orderBy: { provider: 'asc' }
      }
    }
  });
  if (!user) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: `User ${email} not found`
    });
  }
  const { accounts, ...rest } = user;
  return { user: rest, accounts };
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
    case 'completions':
      return readCompletions(db, query.id);
    case 'draws':
      return readDraws(db, query.id);
    case 'accounts':
      return readAccounts(db, query);
    default:
      return assertNever(query);
  }
};
