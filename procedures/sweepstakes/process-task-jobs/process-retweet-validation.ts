import { getRetweetedBy } from '@/lib/integrations/procedures/get-retweets';
import { importTwitterUsers } from '@/lib/sweepstakes/twitter-import';
import { TwitterRetweetTaskSchema } from '@/lib/task/schemas';
import { PrismaClient } from '@prisma/client';
import { TaskJobWithRelations } from './types';
import { datetime } from '@/lib/date';

export const processRetweetTaskJob = async (
  db: PrismaClient,
  task: TwitterRetweetTaskSchema,
  job: TaskJobWithRelations
) => {
  const { taskId } = job;
  const { sweepstakesId } = job.task;
  const { teamId } = job.task.sweepstakes;
  if (!teamId) {
    throw new Error('Sweepstakes teamId is required');
  }

  const response = await getRetweetedBy(db, {
    teamId,
    tweetId: task.tweetId,
    maxResults: 100
  });

  const { imported, existing } = await importTwitterUsers(db, {
    sweepstakesId,
    taskId,
    twitterUsers: response.data ?? []
  });

  console.info(
    `Imported ${imported.length} users, ${existing.length} existing users for retweet task job ${job.id}`
  );

  let created = 0;
  let updated = 0;
  for (const user of [...imported, ...existing]) {
    const { userId, twitterUserId, twitterUsername } = user;
    const existing = await db.taskCompletion.findFirst({
      where: {
        userId,
        taskId,
        status: 'PENDING'
      }
    });

    if (existing) {
      await db.taskCompletion.update({
        where: {
          id: existing.id
        },
        data: {
          status: 'COMPLETED'
        }
      });
      updated++;
    } else {
      await db.taskCompletion.create({
        data: {
          userId,
          taskId,
          status: 'COMPLETED',
          proof: {
            source: 'twitter_import',
            twitterUserId,
            twitterUsername,
            importedAt: new Date().toISOString(),
            validatedBy: 'job_processor'
          }
        }
      });
      created++;
    }
  }

  console.info(
    `Created ${created} and updated ${updated} task completions for retweet task job ${job.id}`
  );
  console.info(
    `Retweet task job ${job.id} completed, scheduling next run in 1 hour`
  );

  await db.taskJob.update({
    where: { id: job.id },
    data: {
      runAt: datetime.hoursFromNow(1)
    }
  });
};
