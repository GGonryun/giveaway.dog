import 'server-only';

import { PrismaClient } from '@giveaway/db-model';
import {
  E2E_JOB_PROCESSORS,
  E2E_MAX_JOB_ROUNDS,
  E2eJobProcessor,
  E2eJobProcessorResult,
  E2eJobsRequest
} from '@giveaway/e2e-model/jobs';
import { runTaskJobs } from '@giveaway/task-jobs/run-task-jobs';
import { runSweepstakesJobs } from '@giveaway/sweepstakes-jobs/run-sweepstakes-jobs';
import { runAutomatedPostJobs } from '@giveaway/automation-server/run-automated-post-jobs';
import { expireE2eSweepstakesTags } from './cache';
import { findE2eSweepstakesId } from './ownership';

type JobRunner = (
  db: PrismaClient,
  options: { sweepstakesId: string }
) => Promise<{ processed: number }>;

const RUNNERS: Record<E2eJobProcessor, JobRunner> = {
  tasks: runTaskJobs,
  sweepstakes: runSweepstakesJobs,
  posts: runAutomatedPostJobs
};

const MAX_JOB_ROWS = 100;

export const readE2eJobs = async ({
  db,
  request
}: {
  db: PrismaClient;
  request: E2eJobsRequest;
}) => {
  const sweepstakesId = await findE2eSweepstakesId(db, request.sweepstakesId);
  const [sweepstakes, tasks, posts] = await Promise.all([
    db.sweepstakesJob.findMany({
      where: { sweepstakesId },
      select: { id: true, type: true, status: true, runAt: true, error: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: MAX_JOB_ROWS
    }),
    db.taskJob.findMany({
      where: { task: { sweepstakesId } },
      select: { id: true, taskId: true, status: true, runAt: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: MAX_JOB_ROWS
    }),
    db.automatedPostJob.findMany({
      where: { sweepstakesId },
      select: {
        id: true,
        type: true,
        status: true,
        runAt: true,
        response: true
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: MAX_JOB_ROWS
    })
  ]);
  return { sweepstakesId, jobs: { sweepstakes, tasks, posts } };
};

export const runE2eJobs = async ({
  db,
  request
}: {
  db: PrismaClient;
  request: E2eJobsRequest;
}) => {
  const sweepstakesId = await findE2eSweepstakesId(db, request.sweepstakesId);
  const results = Object.fromEntries(
    E2E_JOB_PROCESSORS.map((name) => [name, { ok: true, processed: 0 }])
  ) as Record<E2eJobProcessor, E2eJobProcessorResult>;

  let rounds = 0;
  while (rounds < E2E_MAX_JOB_ROUNDS) {
    rounds++;
    let processed = 0;
    for (const name of E2E_JOB_PROCESSORS) {
      const result = results[name];
      if (!result.ok) continue;
      try {
        const run = await RUNNERS[name](db, { sweepstakesId });
        result.processed += run.processed;
        processed += run.processed;
      } catch (error) {
        console.error(
          `[e2e] The ${name} jobs of ${sweepstakesId} failed`,
          error
        );
        results[name] = {
          ok: false,
          processed: result.processed,
          error: error instanceof Error ? error.message : 'The jobs failed'
        };
      }
    }
    if (processed === 0) break;
  }

  expireE2eSweepstakesTags([sweepstakesId], { lists: false });

  return {
    rounds,
    ...results,
    ...(await readE2eJobs({ db, request: { sweepstakesId } }))
  };
};
