import { fetchRetweetersUntilUser } from '@/lib/scrapebadger/procedures/get-retweeters';
import { extractTweetId, toTwitterUserSchema } from '@/lib/scrapebadger/utils';
import { importTwitterUsers } from '@/lib/sweepstakes/twitter-import';
import {
  TASK_JOB_DATA_SCHEMA,
  toTwitterProofSchema,
  TwitterRetweetV2TaskSchema
} from '@/lib/task/schemas';
import { PrismaClient } from '@prisma/client';
import { TaskJobWithRelations } from './types';
import { datetime } from '@/lib/date';
import { ApplicationError } from '@/lib/errors';
import { scheduleRandomlyAssignPrizesJob } from '@/lib/jobs/util';

const SCRAPEBADGER_RUN_OFFSET = 1;
const MAX_RUN_OFFSET = 60;

export const processRetweetV2TaskJob = async (
  db: PrismaClient,
  task: TwitterRetweetV2TaskSchema,
  job: TaskJobWithRelations
) => {
  const { taskId, data } = job;
  const { sweepstakesId } = job.task;

  const parsed = TASK_JOB_DATA_SCHEMA.TWITTER_RETWEET_IMPORT_V2.safeParse(data);
  if (!parsed.success) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Invalid task job data for Twitter V2 import task`,
      cause: parsed.error,
      data: task
    });
  }

  const tweetId = extractTweetId(task.tweetId);
  if (!tweetId) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Could not extract tweet ID from URL',
      data: task
    });
  }

  const response = await fetchRetweetersUntilUser({
    tweetId,
    stopAtUserId: parsed.data.lastProcessedId
  });

  console.info(
    `Fetched ${response.users?.length ?? 0} users in task job ${job.id}`
  );

  const twitterUsers = (response.users || []).map(toTwitterUserSchema);

  console.info(`Processing ${twitterUsers.length} users task job ${job.id}`);

  const { imported, existing } = await importTwitterUsers(db, {
    sweepstakesId,
    taskId,
    twitterUsers
  });

  console.info(
    `Imported ${imported.length} users, ${existing.length} existing users for task job ${job.id}`
  );

  let created = 0;
  let updated = 0;

  for (const user of [...imported, ...existing]) {
    const { userId, twitterUserId, twitterUsername, twitterVerified } = user;
    const existingCompletion = await db.taskCompletion.findFirst({
      where: {
        participant: { userId },
        taskId,
        status: {
          in: ['COMPLETED', 'PENDING']
        }
      }
    });

    const userProof = toTwitterProofSchema({
      source: 'twitter_import',
      twitterUserId,
      twitterUsername,
      twitterVerified,
      importedAt: new Date().toISOString(),
      validatedBy: 'job_processor'
    });

    if (existingCompletion) {
      if (existingCompletion.status === 'PENDING') {
        await db.taskCompletion.update({
          where: {
            id: existingCompletion.id
          },
          data: {
            status: 'COMPLETED',
            proof: userProof
          }
        });
        updated++;
      }
    } else {
      await db.taskCompletion.create({
        data: {
          participant: {
            connectOrCreate: {
              where: {
                userId_sweepstakesId: {
                  sweepstakesId,
                  userId
                }
              },
              create: {
                sweepstakesId,
                userId
              }
            }
          },
          task: {
            connect: { id: taskId }
          },
          status: 'COMPLETED',
          proof: userProof
        }
      });
      created++;
    }
  }

  console.info(
    `Created ${created} and updated ${updated} task completions for task job ${job.id}`
  );

  if (created > 0) {
    await scheduleRandomlyAssignPrizesJob({
      db,
      sweepstakesId
    });
  }

  const nextRunAt = datetime.minutesFromNow(
    Math.min(parsed.data.runs * SCRAPEBADGER_RUN_OFFSET, MAX_RUN_OFFSET)
  );

  await db.taskJob.create({
    data: {
      taskId: job.taskId,
      runAt: nextRunAt,
      data: {
        runs: parsed.data.runs + 1,
        lastProcessedId:
          response.users?.at(0)?.id ?? parsed.data.lastProcessedId
      }
    }
  });
  console.info(
    `Task job ${job.id} completed, scheduling next run at ${nextRunAt}`
  );
};
