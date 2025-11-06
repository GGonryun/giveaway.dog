import { procedure } from '@/lib/mrpc/procedures';
import {
  PickerAuditLogType,
  PickerJobStatus,
  PickerJobType,
  PickerStatus,
  Prisma,
  PrismaClient
} from '@prisma/client';
import { MAX_JOBS_PER_RUN } from '@/schemas/user-scoring';
import {
  ApplicationError,
  isApplicationError,
  isRetryableApplicationError
} from '@/lib/errors';
import { datetime } from '@/lib/date';
import { getLikingUsers } from '@/lib/integrations/procedures/get-liking-users';
import {
  toTwitterData,
  toTwitterFetchData,
  toTwitterFetchRequest,
  TwitterFetchDataSchema,
  twitterFetchDataSchema
} from '../schemas/jobs';
import { Tx } from '@/lib/prisma';
import { TWITTER_API_RATE_LIMIT_MINUTES } from '../data/settings';
import { getRetweetedBy } from '@/lib/integrations/procedures/get-retweets';
import { getQuoteTweets } from '@/lib/integrations/procedures/get-quote-tweets';

export const processJobs = procedure()
  .authorization({
    required: false
  })
  .handler(async ({ db }) => {
    const jobs = await db.pickerJob.findMany({
      where: {
        status: { in: [PickerJobStatus.QUEUED, PickerJobStatus.RUNNING] },
        runAt: {
          lte: new Date()
        }
      },
      take: MAX_JOBS_PER_RUN,
      orderBy: {
        createdAt: 'asc'
      },
      include: PICKER_JOB_CHILDREN_INCLUDE
    });

    console.info(`Found ${jobs.length} jobs to process`);
    for (const job of jobs) {
      try {
        console.info(`Processing job ${job.id} of type ${job.type}`);
        await processJob(db, job);
        console.info(`Finished processing job ${job.id}`);
      } catch (error) {
        const applicationError = isApplicationError(error)
          ? error
          : new ApplicationError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Unknown error occurred while processing job',
              cause: error
            });

        if (isRetryableApplicationError(applicationError)) {
          // Re-queue the job for later
          const retryAfter = applicationError.data?.retryAfter
            ? new Date(applicationError.data?.retryAfter)
            : datetime.minutesFromNow(TWITTER_API_RATE_LIMIT_MINUTES);

          console.warn('Retrying job', job.id, retryAfter);

          db.$transaction(async (tx) => {
            await tx.pickerJob.update({
              where: { id: job.id },
              data: {
                status: PickerJobStatus.QUEUED,
                runAt: retryAfter
              }
            });

            await tx.pickerAuditLog.create({
              data: {
                pickerId: job.pickerId,
                type: PickerAuditLogType.JOB_FAILED,
                data: {
                  id: job.id,
                  job: job.type,
                  retryAfter,
                  message: 'Rate limit exceeded, backing off and retrying later'
                }
              }
            });
          });

          continue;
        }

        console.error('Unable to process job', job.id, error);

        db.$transaction(async (tx) => {
          await tx.pickerJob.update({
            where: { id: job.id },
            data: {
              status: PickerJobStatus.FAILED,
              data: {
                ...((job.data as any) ?? {}),
                error: applicationError.toJSON()
              }
            }
          });

          await tx.pickerAuditLog.create({
            data: {
              pickerId: job.pickerId,
              type: PickerAuditLogType.JOB_FAILED,
              data: { job: job.type, error: applicationError.message }
            }
          });
        });
      }
    }
  });

export const PICKER_JOB_CHILDREN_INCLUDE = {
  children: true,
  picker: true
} satisfies Prisma.PickerJobInclude;

export type PickerJobWithChildren = Prisma.PickerJobGetPayload<{
  include: typeof PICKER_JOB_CHILDREN_INCLUDE;
}>;

const processJob = async (db: PrismaClient, job: PickerJobWithChildren) => {
  switch (job.type) {
    case 'FETCH_TWITTER_DATA':
      return await processFetchTwitterDataJob(db, job);
    case 'FETCH_TWITTER_GET_LIKING_USERS':
      return await processFetchTwitterGetLikingUsersJob(db, job);
    case 'FETCH_TWITTER_GET_REPOSTED_BY':
      return await processFetchTwitterGetRepostedByJob(db, job);
    case 'FETCH_TWITTER_GET_QUOTED_POSTS':
      return await processFetchTwitterGetQuotedPostsJob(db, job);
    default:
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Unknown job type: ${job.type}`,
        data: job
      });
  }
};

const processFetchTwitterDataJob = async (
  db: PrismaClient,
  job: PickerJobWithChildren
) => {
  const someChildrenFailed = job.children.some(
    (child) => child.status === PickerJobStatus.FAILED
  );

  if (someChildrenFailed) {
    await db.$transaction(async (tx) => {
      await db.pickerJob.update({
        where: { id: job.id },
        data: {
          status: PickerJobStatus.FAILED
        }
      });

      await db.picker.update({
        where: { id: job.pickerId },
        data: {
          status: PickerStatus.FAILED
        }
      });

      await db.pickerAuditLog.createMany({
        data: [
          {
            pickerId: job.pickerId,
            type: PickerAuditLogType.JOB_FAILED,
            data: { job: job.type }
          },
          {
            pickerId: job.pickerId,
            type: PickerAuditLogType.CANCELLED,
            data: { reason: 'One or more child jobs failed' }
          }
        ]
      });
    });

    return;
  }

  const someChildrenPending = job.children.some(
    (child) =>
      child.status === PickerJobStatus.RUNNING ||
      child.status === PickerJobStatus.QUEUED
  );

  if (someChildrenPending) {
    // re-queue the job for later
    await db.pickerJob.update({
      where: { id: job.id },
      data: {
        status: PickerJobStatus.QUEUED,
        runAt: datetime.minutesFromNow(1)
      }
    });
    return;
  }

  const data = toTwitterData(job);

  await db.$transaction(async (tx) => {
    await tx.pickerJob.update({
      where: { id: job.id },
      data: {
        status: PickerJobStatus.COMPLETED,
        data
      }
    });
    await tx.picker.update({
      where: { id: job.pickerId },
      data: {
        status: PickerStatus.PROCESSED
      }
    });
    await tx.pickerAuditLog.createMany({
      data: [
        {
          pickerId: job.pickerId,
          type: PickerAuditLogType.JOB_COMPLETED,
          data: { job: job.type }
        },
        {
          pickerId: job.pickerId,
          type: PickerAuditLogType.COMPLETED,
          data: {
            completedAt: new Date()
          }
        }
      ]
    });
  });

  // we need to notify the user that the picker is complete via email template.
};

const processFetchTwitterGetLikingUsersJob = async (
  db: PrismaClient,
  job: PickerJobWithChildren
) =>
  await withAuditTrail(
    db,
    job,
    async (tx, request) =>
      await getLikingUsers(tx, {
        teamId: job.picker.teamId,
        tweetId: request.tweetId,
        paginationToken: request.paginationToken,
        maxResults: 100
      })
  );

const processFetchTwitterGetRepostedByJob = async (
  db: PrismaClient,
  job: PickerJobWithChildren
) =>
  await withAuditTrail(
    db,
    job,
    async (tx, request) =>
      await getRetweetedBy(tx, {
        teamId: job.picker.teamId,
        tweetId: request.tweetId,
        paginationToken: request.paginationToken,
        maxResults: 100
      })
  );

const processFetchTwitterGetQuotedPostsJob = async (
  db: PrismaClient,
  job: PickerJobWithChildren
) => {
  await withAuditTrail(
    db,
    job,
    async (tx, request) =>
      await getQuoteTweets(tx, {
        teamId: job.picker.teamId,
        tweetId: request.tweetId,
        paginationToken: request.paginationToken,
        maxResults: 100
      })
  );
};

const withAuditTrail = async <T extends { meta?: { next_token?: string } }>(
  db: PrismaClient,
  job: PickerJobWithChildren,
  fn: (tx: Tx, request: TwitterFetchDataSchema['request']) => Promise<T>
) => {
  const parsed = twitterFetchDataSchema.safeParse(job.data);

  if (!parsed.success) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid job data',
      cause: parsed.error
    });
  }

  const request = parsed.data.request;

  await db.$transaction(
    async (tx) => {
      await tx.pickerAuditLog.create({
        data: {
          pickerId: job.pickerId,
          type: PickerAuditLogType.JOB_STARTED,
          data: { job: job.type }
        }
      });

      await tx.pickerJob.update({
        where: { id: job.id },
        data: {
          status: PickerJobStatus.RUNNING
        }
      });

      const response = await fn(tx, request);

      if (response.meta?.next_token) {
        await tx.pickerJob.create({
          data: {
            pickerId: job.pickerId,
            parentId: job.parentId,
            type: job.type,
            status: PickerJobStatus.QUEUED,
            runAt: datetime.minutesFromNow(TWITTER_API_RATE_LIMIT_MINUTES),
            data: toTwitterFetchRequest({
              tweetId: request.tweetId,
              paginationToken: response.meta.next_token
            })
          }
        });
      }

      await tx.pickerJob.update({
        where: { id: job.id },
        data: {
          status: PickerJobStatus.COMPLETED,
          data: toTwitterFetchData({ request, response })
        }
      });

      await tx.pickerAuditLog.create({
        data: {
          pickerId: job.pickerId,
          type: PickerAuditLogType.JOB_COMPLETED,
          data: { job: job.type }
        }
      });
    },
    {
      maxWait: 10000
    }
  );
};
