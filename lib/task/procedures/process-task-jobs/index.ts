'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';
import { processTaskJob } from './process-job';
import { taskJobInclude } from './types';

const MAX_JOBS_PER_RUN = 10;

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
      take: MAX_JOBS_PER_RUN,
      include: taskJobInclude
    });

    console.info(`Found ${pending.length} task jobs to process`);
    for (const job of pending) {
      try {
        await processTaskJob(db, job);
      } catch (error) {
        console.error(`Failed to process job ${job.id}`, error);
      }
    }

    return {
      processed: pending.length
    };
  });
