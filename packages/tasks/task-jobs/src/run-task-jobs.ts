import 'server-only';

import { processTaskJob } from './process-task-job';
import { taskJobInclude } from '@giveaway/task-jobs-core/types';
import { PrismaClient, TaskJobStatus } from '@giveaway/db-model';
import { isRetryableApplicationError } from '@giveaway/util-errors';

const MAX_JOBS_PER_RUN = 5;
const STUCK_JOB_TIMEOUT_MS = 10 * 60 * 1000;

export const runTaskJobs = async (
  db: PrismaClient,
  { sweepstakesId }: { sweepstakesId?: string } = {}
) => {
  const now = new Date();
  const sweepstakesFilter = sweepstakesId ? { task: { sweepstakesId } } : {};

  await db.taskJob.updateMany({
    where: {
      status: TaskJobStatus.IN_PROGRESS,
      updatedAt: {
        lt: new Date(now.getTime() - STUCK_JOB_TIMEOUT_MS)
      },
      ...sweepstakesFilter
    },
    data: {
      status: TaskJobStatus.PENDING
    }
  });

  const pending = await db.taskJob.findMany({
    where: {
      runAt: {
        lte: now
      },
      status: {
        in: [TaskJobStatus.PENDING]
      },
      ...sweepstakesFilter
    },
    orderBy: {
      createdAt: 'asc'
    },
    take: MAX_JOBS_PER_RUN,
    include: taskJobInclude
  });

  console.info(`Found ${pending.length} task jobs to process`);
  let processed = 0;
  for (const job of pending) {
    const { count } = await db.taskJob.updateMany({
      where: {
        id: job.id,
        status: TaskJobStatus.PENDING,
        runAt: { lte: now }
      },
      data: {
        status: TaskJobStatus.IN_PROGRESS
      }
    });
    if (count === 0) continue;
    processed++;
    try {
      await processTaskJob(db, job);
      await db.taskJob.updateMany({
        where: { id: job.id },
        data: {
          status: TaskJobStatus.COMPLETED
        }
      });
    } catch (error) {
      if (isRetryableApplicationError(error)) {
        const retryAfter = new Date(error.data.retryAfter);
        console.warn('Retrying job', job.id, retryAfter);
        await db.taskJob.updateMany({
          where: { id: job.id },
          data: {
            status: TaskJobStatus.PENDING,
            runAt: retryAfter
          }
        });
      } else {
        console.error(`Failed to process job ${job.id}`, error);
        await db.taskJob.updateMany({
          where: { id: job.id },
          data: {
            status: TaskJobStatus.FAILED,
            data: JSON.stringify(error ?? {})
          }
        });
      }
    }
  }

  return {
    processed
  };
};
