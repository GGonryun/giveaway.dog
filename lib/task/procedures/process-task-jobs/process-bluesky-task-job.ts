import { importBlueskyUsers } from '@/lib/sweepstakes/bluesky-import';
import {
  TASK_JOB_DATA_SCHEMA,
  BlueskyLikeImportTaskSchema,
  BlueskyRepostImportTaskSchema
} from '@/lib/task/schemas';
import { PrismaClient, TaskJobStatus } from '@prisma/client';
import { TaskJobWithRelations } from './types';
import { datetime } from '@/lib/date';
import { ApplicationError } from '@/lib/errors';
import { takeUntil } from '@/lib/arrays';
import { Tx } from '@/lib/prisma';
import { BlueskyUserSchema } from '@/lib/integrations/procedures/get-bluesky-likes';
import { BLUESKY_API_RATE_LIMIT_MINUTES } from '@/lib/pickers/twitter/data/settings';
import { getLatestTeamBlueskyCredentials } from '@/lib/bluesky/get-latest-team-bluesky-agent';
import { Agent } from '@atproto/api';
import { scheduleRandomlyAssignPrizesJob } from '@/lib/jobs/util';

export const processBlueskyTaskJob = async <
  T extends BlueskyLikeImportTaskSchema | BlueskyRepostImportTaskSchema
>(
  db: PrismaClient,
  task: T,
  job: TaskJobWithRelations,
  action: (tx: Tx, agent: Agent) => Promise<{ data?: BlueskyUserSchema[] }>
) => {
  const { taskId, data } = job;
  const { sweepstakesId } = job.task;
  const { type } = task;

  const parsed = TASK_JOB_DATA_SCHEMA[type].safeParse(data);
  if (!parsed.success) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Invalid task job data for Bluesky import task`,
      cause: parsed.error,
      data: task
    });
  }

  // Get Bluesky agent for API calls
  const teamId = job.task.sweepstakes.teamId;
  const { agent } = await getLatestTeamBlueskyCredentials(db, teamId!);

  const response = await action(db, agent);

  console.info(
    `[${type}] Fetched ${response.data?.length ?? 0} users in task job ${job.id}`
  );

  const blueskyUsers = takeUntil(
    response.data,
    (user) => user.did === parsed.data.lastProcessedDid
  );

  console.info(
    `[${type}] Processing ${blueskyUsers.length} users task job ${job.id}`
  );

  const { imported, existing } = await importBlueskyUsers(db, {
    sweepstakesId,
    taskId,
    blueskyUsers
  });

  console.info(
    `[${type}] Imported ${imported.length} users, ${existing.length} existing users for task job ${job.id}`
  );

  let created = 0;
  let updated = 0;

  for (const user of [...imported, ...existing]) {
    const { userId, blueskyDid, blueskyHandle } = user;
    const existingCompletion = await db.taskCompletion.findFirst({
      where: {
        participant: { userId },
        taskId,
        status: {
          in: ['COMPLETED', 'PENDING']
        }
      }
    });

    if (existingCompletion) {
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
          proof: {
            source: 'bluesky_import',
            blueskyDid,
            blueskyHandle,
            importedAt: new Date().toISOString(),
            validatedBy: 'job_processor'
          }
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
    await scheduleRandomlyAssignPrizesJob({
      db,
      sweepstakesId
    });
  }

  const nextRunAt = datetime.minutesFromNow(
    parsed.data.runs * 5 + BLUESKY_API_RATE_LIMIT_MINUTES
  );

  await db.taskJob.create({
    data: {
      taskId: job.taskId,
      status: TaskJobStatus.PENDING,
      runAt: nextRunAt,
      data: {
        runs: parsed.data.runs + 1,
        lastProcessedDid: response.data?.at(0)?.did
      }
    }
  });

  console.info(
    `[${type}] Task job ${job.id} completed, scheduling next run at ${nextRunAt}`
  );
};
