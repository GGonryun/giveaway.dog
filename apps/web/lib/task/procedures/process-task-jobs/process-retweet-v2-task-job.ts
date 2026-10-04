import { getRetweetersUntilUser } from '@/lib/scrapebadger/procedures/get-retweeters';
import { extractTweetId, toTwitterUserSchema } from '@/lib/scrapebadger/utils';
import { importTwitterUsers } from '@/lib/sweepstakes/twitter-import';
import {
  TASK_JOB_DATA_SCHEMA,
  toTwitterProofSchema,
  TwitterRetweetV2TaskSchema
} from '@/lib/task/schemas';
import { PrismaClient } from '@prisma/client';
import { TaskJobWithRelations } from '@giveaway/task-jobs-core/types';
import { datetime } from '@/lib/date';
import { ApplicationError } from '@giveaway/util-errors';
import { scheduleRandomlyAssignPrizesJob } from '@giveaway/jobs/util';

const SCRAPEBADGER_RUN_OFFSET = 5;
const MAX_RUN_OFFSET = 360;

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

  const isContinuation = !!parsed.data.nextCursor;

  const response = await getRetweetersUntilUser({
    tweetId,
    stopAtUserId: parsed.data.lastProcessedId,
    cursor: parsed.data.nextCursor
  });

  console.info(
    `Fetched ${response.users?.length ?? 0} users in task job ${job.id} (continuation=${isContinuation})`
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

  const endDate = job.task.sweepstakes.timing?.endDate;
  const now = new Date();

  const firstSeenId = isContinuation
    ? parsed.data.firstSeenId
    : response.users?.at(0)?.id;

  const scanComplete = !response.hasMore || !response.nextCursor;

  if (!scanComplete) {
    console.info(
      `Scan incomplete for task job ${job.id}, scheduling continuation with cursor`
    );
    await db.taskJob.create({
      data: {
        taskId: job.taskId,
        runAt: new Date(),
        data: {
          runs: parsed.data.runs,
          nextCursor: response.nextCursor,
          lastProcessedId: parsed.data.lastProcessedId,
          firstSeenId
        }
      }
    });
    return;
  }

  if (endDate && now >= endDate) {
    console.info(
      `Task job ${job.id} completed, sweepstakes has ended - not scheduling next run`
    );
    return;
  }

  let nextRunAt = datetime.minutesFromNow(
    Math.min(parsed.data.runs * SCRAPEBADGER_RUN_OFFSET, MAX_RUN_OFFSET)
  );

  if (endDate && nextRunAt > endDate) {
    nextRunAt = endDate;
    console.info(`Approaching end date, scheduling final run at ${nextRunAt}`);
  }

  await db.taskJob.create({
    data: {
      taskId: job.taskId,
      runAt: nextRunAt,
      data: {
        runs: parsed.data.runs + 1,
        lastProcessedId: firstSeenId ?? parsed.data.lastProcessedId
      }
    }
  });
  console.info(
    `Task job ${job.id} scan complete, scheduling next run at ${nextRunAt}`
  );
};
