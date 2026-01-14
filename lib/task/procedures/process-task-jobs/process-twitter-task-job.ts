import { importTwitterUsers } from '@/lib/sweepstakes/twitter-import';
import {
  TASK_JOB_DATA_SCHEMA,
  toTwitterProofSchema,
  TwitterLikeImportTaskSchema,
  TwitterRetweetImportTaskSchema
} from '@/lib/task/schemas';
import { PrismaClient } from '@prisma/client';
import { TaskJobWithRelations } from './types';
import { datetime } from '@/lib/date';
import { TWITTER_API_RATE_LIMIT_MINUTES } from '@/lib/pickers/data/settings';
import { ApplicationError } from '@/lib/errors';
import { takeUntil } from '@/lib/arrays';
import { Tx } from '@/lib/prisma';
import { TwitterUserSchema } from '@/lib/integrations/schemas/api';

export const processTwitterTaskJob = async <
  T extends TwitterLikeImportTaskSchema | TwitterRetweetImportTaskSchema
>(
  db: PrismaClient,
  task: T,
  job: TaskJobWithRelations,
  action: (tx: Tx) => Promise<{ data?: TwitterUserSchema[] }>
) => {
  const { taskId, data } = job;
  const { sweepstakesId } = job.task;
  const { type } = task;

  const parsed = TASK_JOB_DATA_SCHEMA[type].safeParse(data);
  if (!parsed.success) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Invalid task job data for Twitter import task`,
      cause: parsed.error,
      data: task
    });
  }

  const response = await action(db);

  console.info(
    `[${type}] Fetched ${response.data?.length ?? 0} users in task job ${job.id}`
  );

  const twitterUsers = takeUntil(
    response.data,
    (user) => user.id === parsed.data.lastProcessedId
  );

  console.info(
    `[${type}] Processing ${twitterUsers.length} users task job ${job.id}`
  );

  const { imported, existing } = await importTwitterUsers(db, {
    sweepstakesId,
    taskId,
    twitterUsers
  });

  console.info(
    `[${type}] Imported ${imported.length} users, ${existing.length} existing users for task job ${job.id}`
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
      // update only if status is PENDING
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
      } else {
        // ignore if already completed
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
    `[${type}] Created ${created} and updated ${updated} task completions for task job ${job.id}`
  );

  // Schedule prize allocation job if participants were created
  if (created > 0) {
    await db.sweepstakesJob.upsert({
      where: {
        sweepstakesId_type: {
          sweepstakesId,
          type: 'RANDOMLY_ASSIGN_PRIZES'
        }
      },
      create: {
        sweepstakesId,
        type: 'RANDOMLY_ASSIGN_PRIZES',
        status: 'PENDING',
        runAt: datetime.minutesFromNow(1)
      },
      update: {
        status: 'PENDING',
        runAt: datetime.minutesFromNow(1)
      }
    });
    console.info(
      `[${type}] Scheduled RANDOMLY_ASSIGN_PRIZES job for sweepstakes ${sweepstakesId}`
    );
  }

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
    `[${type}] Task job ${job.id} completed, scheduling next run at ${nextRunAt}`
  );
};
