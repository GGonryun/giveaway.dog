import { BlueskyRepostImportTaskSchema } from '@/lib/task/schemas';
import { TaskJobWithRelations } from './types';
import { getBlueskyReposts } from '@/lib/integrations/procedures/get-bluesky-reposts';
import { processBlueskyTaskJob } from './process-bluesky-task-job';
import { PrismaClient } from '@prisma/client';

export const processBlueskyRepostTaskJob = async (
  db: PrismaClient,
  task: BlueskyRepostImportTaskSchema,
  job: TaskJobWithRelations
) => {
  const { postUrl } = task;

  return processBlueskyTaskJob(db, task, job, async (tx, agent) => {
    const response = await getBlueskyReposts(tx, {
      postUrl,
      agent
    });

    return {
      data: response.data
    };
  });
};
