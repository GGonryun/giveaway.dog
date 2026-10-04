import { ApplicationError, assertNever } from '@giveaway/util-errors';
import { toTaskSchema } from '@giveaway/task-model/schemas';
import { PrismaClient, TaskJobStatus } from '@prisma/client';
import { TaskJobWithRelations } from '@giveaway/task-jobs-core/types';
import { processBlueskyLikeTaskJob } from '@giveaway/bluesky-task-jobs/process-bluesky-like-task-job';
import { processBlueskyRepostTaskJob } from '@giveaway/bluesky-task-jobs/process-bluesky-repost-task-job';
import { processRetweetV2TaskJob } from '@giveaway/x-task-jobs/process-retweet-v2-task-job';

const END_DATE_BUFFER_MINUTES = 15;

export const processTaskJob = async (
  db: PrismaClient,
  job: TaskJobWithRelations
) => {
  console.info(`Processing task job ${job.id}`, job);

  const { timing, status } = job.task.sweepstakes;
  if (status !== 'ACTIVE') {
    console.info(
      `Sweepstakes ${job.task.sweepstakes.id} is not active, deleting task job ${job.id}`
    );

    await db.taskJob.delete({
      where: { id: job.id }
    });

    return;
  }

  // if the sweepstakes has a start date in the future, reschedule the job.
  if (timing?.startDate && timing.startDate > new Date()) {
    console.info(
      `Sweepstakes ${job.task.sweepstakes.id} has not started yet, rescheduling task job ${job.id} to ${timing.startDate}`
    );

    await db.taskJob.update({
      where: { id: job.id },
      data: {
        runAt: timing.startDate,
        status: TaskJobStatus.PENDING
      }
    });

    return;
  }

  const task = toTaskSchema(job.task);
  if (timing?.endDate) {
    const bufferMs = END_DATE_BUFFER_MINUTES * 60 * 1000;
    const endDateWithBuffer = new Date(timing.endDate.getTime() + bufferMs);
    if (endDateWithBuffer < new Date()) {
      console.info(
        `Sweepstakes ${job.task.sweepstakes.id} has ended (past ${END_DATE_BUFFER_MINUTES}min buffer), deleting task job ${job.id}`
      );

      await db.taskJob.delete({
        where: { id: job.id }
      });

      return;
    }
  }

  switch (task.type) {
    case 'BONUS_TASK':
    case 'BONUS_COMPLETE_PROFILE':
    case 'BONUS_TIMED':
    case 'BONUS_LIMITED':
    case 'BONUS_LOYALTY':
    case 'DISCORD_JOIN':
    case 'KICK_FOLLOW':
    case 'VISIT_URL':
    case 'TWITTER_CONNECT':
    case 'TWITTER_FOLLOW':
    case 'STEAM_WISHLIST':
    case 'STEAM_FOLLOW':
    case 'TWITCH_FOLLOW':
    case 'YOUTUBE_VISIT':
    case 'TWITTER_LIKE':
    case 'SECRET_CODE':
    case 'SECRET_CODE_V2':
    case 'TWITTER_RETWEET':
    case 'INSTAGRAM_VISIT':
    case 'INSTAGRAM_LIKE':
    case 'INSTAGRAM_COMMENT':
    case 'FACEBOOK_VISIT_PAGE':
    case 'FACEBOOK_VIEW_POST':
    case 'TIKTOK_FOLLOW':
    case 'TIKTOK_LIKE':
    case 'ASK_QUESTION':
    case 'SINGLE_CHOICE':
    case 'BLUESKY_CONNECT':
    case 'BLUESKY_FOLLOW':
    case 'BLUESKY_LIKE':
    case 'BLUESKY_REPOST':
    case 'VELORA_CONNECT':
    case 'VELORA_FOLLOW':
    case 'LINKEDIN_CONNECT':
    case 'LINKEDIN_FOLLOW':
    case 'REFERRAL_LINK':
    case 'MULTIPLE_CHOICE':
    case 'SUBMIT_MEDIA':
    case 'DISCORD_INTERACTION_IMPORT':
    case 'TWITCH_CHAT_IMPORT':
      throw new ApplicationError({
        code: 'NOT_IMPLEMENTED',
        message: `Job processing not implemented for task type: ${task.type}`
      });
    case 'TWITTER_RETWEET_IMPORT_V2':
      return await processRetweetV2TaskJob(db, task, job);
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_LIKE_IMPORT':
      throw new ApplicationError({
        code: 'NOT_IMPLEMENTED',
        message: `Job processing for task type ${task.type} is no longer supported`
      });
    case 'BLUESKY_LIKE_IMPORT':
      return await processBlueskyLikeTaskJob(db, task, job);
    case 'BLUESKY_REPOST_IMPORT':
      return await processBlueskyRepostTaskJob(db, task, job);
    default:
      throw assertNever(task);
  }
};
