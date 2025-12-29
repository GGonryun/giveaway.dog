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
  const teamId = job.task.sweepstakes.teamId;

  return processBlueskyTaskJob(db, task, job, async (tx) => {
    const response = await getBlueskyReposts(tx, {
      postUrl,
      teamId: teamId!
    });

    return {
      data: response.data
    };
  });
};
