'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';
import { isRetryableApplicationError } from '@/lib/errors';
import { toTaskSchema } from '@/lib/task/schemas';
import { processJob } from './process-job';

export const processTaskJobs = procedure()
  .authorization({ required: false })
  .output(
    z.object({
      processed: z.number()
    })
  )
  .handler(async ({ db }) => {
    const now = new Date();

    const pending = await db.taskJob.findMany({
      where: {
        runAt: {
          lte: now
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        task: {
          include: {
            sweepstakes: {
              include: {
                timing: true
              }
            }
          }
        }
      }
    });

    for (const job of pending) {
      try {
        const task = toTaskSchema(job.task);
        await processJob(db, task, job);
      } catch (error) {
        console.error(`Failed to process job ${job.id}`, error);
      }
    }

    return {
      processed: pending.length
    };
  });
