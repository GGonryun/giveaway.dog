import {
  ApplicationError,
  assertNever,
  isRetryableApplicationError
} from '@/lib/errors';
import { processRetweetTaskJob } from './process-retweet-task-job';
import { TaskSchema } from '@/lib/task/schemas';
import { PrismaClient } from '@prisma/client';
import { TaskJobWithRelations } from './types';
import { processLikeTaskJob } from './process-like-task-job';

export const processTaskJob = async (
  db: PrismaClient,
  task: TaskSchema,
  job: TaskJobWithRelations
) => {
  try {
    console.info(`Processing task job ${job.id}`, job);

    const { timing } = job.task.sweepstakes;
    // if the sweepstakes has a start date in the future, reschedule the job.
    if (timing?.startDate && timing.startDate > new Date()) {
      console.info(
        `[${task.type}] Sweepstakes ${job.task.sweepstakes.id} has not started yet, rescheduling task job ${job.id} to ${timing.startDate}`
      );

      await db.taskJob.update({
        where: { id: job.id },
        data: {
          runAt: timing.startDate
        }
      });

      return;
    }
    // if the sweepstakes has ended, cancel the job.
    if (timing?.endDate && timing.endDate < new Date()) {
      console.info(
        `[${task.type}] Sweepstakes ${job.task.sweepstakes.id} has ended, deleting task job ${job.id}`
      );

      await db.taskJob.delete({
        where: { id: job.id }
      });

      return;
    }

    switch (task.type) {
      case 'BONUS_TASK':
      case 'BONUS_TIMED':
      case 'BONUS_LIMITED':
      case 'BONUS_LOYALTY':
      case 'DISCORD_JOIN':
      case 'KICK_FOLLOW':
      case 'VISIT_URL':
      case 'TWITTER_CONNECT':
      case 'TWITTER_FOLLOW':
      case 'STEAM_WISHLIST':
      case 'TWITCH_FOLLOW':
      case 'YOUTUBE_VISIT':
      case 'TWITTER_LIKE':
      case 'SECRET_CODE':
      case 'TWITTER_RETWEET':
        throw new ApplicationError({
          code: 'NOT_IMPLEMENTED',
          message: `Job processing not implemented for task type: ${task.type}`
        });
      case 'TWITTER_RETWEET_IMPORT':
        return await processRetweetTaskJob(db, task, job);
      case 'TWITTER_LIKE_IMPORT':
        return await processLikeTaskJob(db, task, job);
      default:
        throw assertNever(task);
    }
  } catch (error) {
    if (isRetryableApplicationError(error)) {
      const retryAfter = new Date(error.data.retryAfter);

      await db.taskJob.update({
        where: { id: job.id },
        data: {
          runAt: retryAfter
        }
      });
      console.warn('Retrying job', job.id, retryAfter);
    } else {
      await db.taskJob.delete({
        where: { id: job.id }
      });
      // TODO: we need to alert somehow that a job has failed permanently and been deleted
      console.error(`Failed to process job ${job.id}`, error);
    }
  }
};
