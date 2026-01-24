import { TwitterLikeImportTaskSchema } from '@/lib/task/schemas';
import { PrismaClient } from '@prisma/client';
import { TaskJobWithRelations } from './types';
import { processTwitterTaskJob } from './process-twitter-task-job';
import { getLikingUsers } from '@/lib/integrations/procedures/get-liking-users';

export const processLikeTaskJob = async (
  db: PrismaClient,
  task: TwitterLikeImportTaskSchema,
  job: TaskJobWithRelations
) => {
  await processTwitterTaskJob(
    db,
    task,
    job,
    async (tx) =>
      await getLikingUsers(tx, {
        teamId: job.task.sweepstakes.teamId,
        integrationId: task.importingAccount,
        tweetId: task.tweetId,
        maxResults: 100
      })
  );
};
