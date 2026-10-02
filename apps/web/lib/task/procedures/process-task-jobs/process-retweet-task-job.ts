import { getRetweetedBy } from '@/lib/integrations/procedures/get-retweets';
import { TwitterRetweetImportTaskSchema } from '@/lib/task/schemas';
import { PrismaClient } from '@prisma/client';
import { TaskJobWithRelations } from './types';
import { processTwitterTaskJob } from './process-twitter-task-job';

export const processRetweetTaskJob = async (
  db: PrismaClient,
  task: TwitterRetweetImportTaskSchema,
  job: TaskJobWithRelations
) => {
  await processTwitterTaskJob(
    db,
    task,
    job,
    async (tx) =>
      await getRetweetedBy(tx, {
        teamId: job.task.sweepstakes.teamId,
        integrationId: task.importingAccount,
        tweetId: task.tweetId,
        maxResults: 100
      })
  );
};
