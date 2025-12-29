import { BlueskyLikeImportTaskSchema } from '@/lib/task/schemas';
import { TaskJobWithRelations } from './types';
import { getBlueskyLikes } from '@/lib/integrations/procedures/get-bluesky-likes';
import { processBlueskyTaskJob } from './process-bluesky-task-job';
import { PrismaClient } from '@prisma/client';

export const processBlueskyLikeTaskJob = async (
  db: PrismaClient,
  task: BlueskyLikeImportTaskSchema,
  job: TaskJobWithRelations
) => {
  const { postUrl } = task;
  const teamId = job.task.sweepstakes.teamId;

  return processBlueskyTaskJob(db, task, job, async (tx) => {
    const response = await getBlueskyLikes(tx, {
      postUrl,
      teamId: teamId!
    });

    return {
      data: response.data
    };
  });
};
