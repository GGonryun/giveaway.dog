import { getRetweetedBy } from '@/lib/integrations/procedures/get-retweets';
import { importTwitterUsers } from '@/lib/sweepstakes/twitter-import';
import {
  TASK_JOB_DATA_SCHEMA,
  TwitterRetweetImportTaskSchema
} from '@/lib/task/schemas';
import { PrismaClient } from '@prisma/client';
import { TaskJobWithRelations } from './types';
import { datetime } from '@/lib/date';
import { TWITTER_API_RATE_LIMIT_MINUTES } from '@/lib/pickers/data/settings';
import { ApplicationError } from '@/lib/errors';
import { takeUntil } from '@/lib/arrays';

export const processRetweetTaskJob = async (
  db: PrismaClient,
  task: TwitterRetweetImportTaskSchema,
  job: TaskJobWithRelations
) => {
  const { taskId, data } = job;
  const { sweepstakesId } = job.task;
  const { teamId, timing } = job.task.sweepstakes;
  if (!teamId) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Sweepstakes teamId is required'
    });
  }

  const parsed = TASK_JOB_DATA_SCHEMA.TWITTER_RETWEET_IMPORT.safeParse(data);
  if (!parsed.success) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Invalid task job data for Twitter retweet import task',
      cause: parsed.error
    });
  }

  // if the sweepstakes has ended, cancel the job.
  if (timing?.endDate && timing.endDate < new Date()) {
    console.info(
      `Sweepstakes ${sweepstakesId} has ended, deleting retweet task job ${job.id}`
    );
    await db.taskJob.delete({
      where: { id: job.id }
    });
    return;
  }

  const response = await getRetweetedBy(db, {
    teamId,
    tweetId: task.tweetId,
    maxResults: 100
  });

  console.info(
    `Fetched ${response.data?.length ?? 0} retweets for tweet ${task.tweetId} in retweet task job ${job.id}`
  );

  const twitterUsers = takeUntil(
    response.data,
    (user) => user.id === parsed.data.lastProcessedId
  );

  console.info(
    `Processing ${twitterUsers.length} new retweets for retweet task job ${job.id}`
  );

  const { imported, existing } = await importTwitterUsers(db, {
    sweepstakesId,
    taskId,
    twitterUsers
  });

  console.info(
    `Imported ${imported.length} users, ${existing.length} existing users for retweet task job ${job.id}`
  );

  let created = 0;
  let updated = 0;

  for (const user of [...imported, ...existing]) {
    const { userId, twitterUserId, twitterUsername } = user;
    const existingCompletion = await db.taskCompletion.findFirst({
      where: {
        userId,
        taskId,
        status: {
          in: ['COMPLETED', 'PENDING']
        }
      }
    });

    if (existingCompletion) {
      // update only if status is PENDING
      if (existingCompletion.status === 'PENDING') {
        await db.taskCompletion.update({
          where: {
            id: existingCompletion.id
          },
          data: {
            status: 'COMPLETED'
          }
        });
        updated++;
      } else {
        // ignore if already completed
      }
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

  const nextRunAt = datetime.minutesFromNow(
    parsed.data.runs * 5 + TWITTER_API_RATE_LIMIT_MINUTES
  );

  await db.taskJob.update({
    where: { id: job.id },
    data: {
      runAt: nextRunAt,
      data: {
        runs: parsed.data.runs + 1,
        lastProcessedId: response.data?.at(0)?.id
      }
    }
  });
  console.info(
    `Retweet task job ${job.id} completed, scheduling next run at ${nextRunAt}`
  );
};
