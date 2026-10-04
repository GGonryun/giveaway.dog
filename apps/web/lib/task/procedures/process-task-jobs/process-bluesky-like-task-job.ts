import { BlueskyLikeImportTaskSchema } from '@/lib/task/schemas';
import { TaskJobWithRelations } from '@giveaway/task-jobs-core/types';
import { getBlueskyLikes } from '@giveaway/bluesky-api/get-bluesky-likes';
import { processBlueskyTaskJob } from './process-bluesky-task-job';
import { PrismaClient } from '@prisma/client';

export const processBlueskyLikeTaskJob = async (
  db: PrismaClient,
  task: BlueskyLikeImportTaskSchema,
  job: TaskJobWithRelations
) => {
  const { postUrl } = task;

  return processBlueskyTaskJob(db, task, job, async (tx, agent) => {
    const response = await getBlueskyLikes(tx, {
      postUrl,
      agent
    });

    return {
      data: response.data
    };
  });
};
