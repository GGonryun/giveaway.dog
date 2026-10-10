import 'server-only';

import { PrismaClient } from '@giveaway/db-model';
import { toE2ePersonaEmail } from '@giveaway/e2e-model/personas';
import {
  E2eJobsRunRequest,
  E2eUserJobsRequest
} from '@giveaway/e2e-model/requests';
import { runAutomatedPostJobs } from '@giveaway/automation-server/process-automated-post-jobs';
import { runSweepstakesJobs } from '@giveaway/sweepstakes-jobs/process-sweepstakes-jobs';
import { runTaskJobs } from '@giveaway/task-jobs/process-task-jobs';
import { runScoring } from '@giveaway/scoring-server/scoring';
import { runTracking } from '@giveaway/scoring-server/tracking';
import { ApplicationError } from '@giveaway/util-errors';
import { expireE2eSweepstakesTags } from './cache';
import { findE2eSweepstakesId } from './ownership';

export const E2E_MAX_JOB_ROUNDS = 10;

const MAX_JOB_ROWS = 100;

export const readE2eJobs = async (db: PrismaClient, id: string) => {
  const sweepstakesId = await findE2eSweepstakesId(db, id);
  const [sweepstakes, posts, tasks] = await Promise.all([
    db.sweepstakesJob.findMany({
      where: { sweepstakesId },
      select: { type: true, status: true, runAt: true, error: true },
      orderBy: { type: 'asc' },
      take: MAX_JOB_ROWS
    }),
    db.automatedPostJob.findMany({
      where: { sweepstakesId },
      select: { type: true, status: true, runAt: true },
      orderBy: { type: 'asc' },
      take: MAX_JOB_ROWS
    }),
    db.taskJob.findMany({
      where: { task: { sweepstakesId } },
      select: { taskId: true, status: true, runAt: true },
      orderBy: { createdAt: 'asc' },
      take: MAX_JOB_ROWS
    })
  ]);
  return { sweepstakes, posts, tasks };
};

export const runE2eJobs = async ({
  db,
  request
}: {
  db: PrismaClient;
  request: E2eJobsRunRequest;
}) => {
  const sweepstakesId = await findE2eSweepstakesId(db, request.sweepstakesId);
  const scope = { sweepstakesId };
  const processed = { tasks: 0, sweepstakes: 0, posts: 0 };
  let rounds = 0;

  while (rounds < E2E_MAX_JOB_ROUNDS) {
    rounds++;
    const tasks = await runTaskJobs(db, scope);
    const sweepstakes = await runSweepstakesJobs(db, scope);
    const posts = await runAutomatedPostJobs(db, scope);
    processed.tasks += tasks.processed;
    processed.sweepstakes += sweepstakes.processed;
    processed.posts += posts.processed;
    if (tasks.processed + sweepstakes.processed + posts.processed === 0) break;
  }

  expireE2eSweepstakesTags([sweepstakesId], { lists: false });

  return {
    processed,
    rounds,
    jobs: await readE2eJobs(db, sweepstakesId)
  };
};

export const runE2eUserJobs = async ({
  db,
  request
}: {
  db: PrismaClient;
  request: E2eUserJobsRequest;
}) => {
  const email = toE2ePersonaEmail(request.persona, request.ns);
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true }
  });

  if (!user) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: `User ${email} not found`
    });
  }

  const tracking = await runTracking(db, { userId: user.id });
  const scoring = await runScoring(db, { userId: user.id });
  const quality = await db.userQuality.findFirst({
    where: { userId: user.id },
    select: { score: true },
    orderBy: { updatedAt: 'desc' }
  });

  return {
    userId: user.id,
    tracking,
    scoring,
    score: quality?.score ?? null
  };
};
