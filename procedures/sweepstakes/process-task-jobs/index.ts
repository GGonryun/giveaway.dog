'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';
import { toTaskSchema } from '@/lib/task/schemas';
import { processTaskJob } from './process-job';
import { taskJobInclude } from './types';

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
      include: taskJobInclude
    });

    console.info(`Found ${pending.length} task jobs to process`);
    for (const job of pending) {
      try {
        const task = toTaskSchema(job.task);
        await processTaskJob(db, task, job);
      } catch (error) {
        console.error(`Failed to process job ${job.id}`, error);
      }
    }

    return {
      processed: pending.length
    };
  });
