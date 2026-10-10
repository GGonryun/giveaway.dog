import 'server-only';

import { processTaskJob } from './process-task-job';
import { taskJobInclude } from '@giveaway/task-jobs-core/types';
import { PrismaClient, TaskJobStatus } from '@giveaway/db-model';
import { isRetryableApplicationError } from '@giveaway/util-errors';
import {
  JobScope,
  MAX_JOBS_PER_RUN,
  toTaskJobScope
} from '@giveaway/jobs/scope';

export const runTaskJobs = async (db: PrismaClient, scope: JobScope = {}) => {
  const now = new Date();

  const pending = await db.taskJob.findMany({
    where: {
      ...toTaskJobScope(scope),
      runAt: {
        lte: now
      },
      status: {
        in: [TaskJobStatus.PENDING]
      }
    },
    orderBy: {
      createdAt: 'asc'
    },
    take: MAX_JOBS_PER_RUN,
    include: taskJobInclude
  });

  console.info(`Found ${pending.length} task jobs to process`);
  for (const job of pending) {
    try {
      await db.taskJob.update({
        where: { id: job.id },
        data: {
          status: TaskJobStatus.IN_PROGRESS
        }
      });
      await processTaskJob(db, job);
      await db.taskJob.update({
        where: { id: job.id },
        data: {
          status: TaskJobStatus.COMPLETED
        }
      });
    } catch (error) {
      if (isRetryableApplicationError(error)) {
        const retryAfter = new Date(error.data.retryAfter);
        console.warn('Retrying job', job.id, retryAfter);
        await db.taskJob.update({
          where: { id: job.id },
          data: {
            status: TaskJobStatus.PENDING,
            runAt: retryAfter
          }
        });
      } else {
        console.error(`Failed to process job ${job.id}`, error);
        await db.taskJob.update({
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
    processed: pending.length
  };
};
