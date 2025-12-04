import { procedure } from '@/lib/mrpc/procedures';
import {
  PickerAuditLogType,
  PickerJobStatus,
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
  twitterFetchDataSchema,
  FetchTwitterDataSchema
} from '../schemas/jobs';
import { Tx } from '@/lib/prisma';
import { TWITTER_API_RATE_LIMIT_MINUTES } from '../data/settings';
import { getRetweetedBy } from '@/lib/integrations/procedures/get-retweets';
import { getQuoteTweets } from '@/lib/integrations/procedures/get-quote-tweets';
import { newEmailClient, NO_REPLY_EMAIL } from '@/lib/email/client';
import { getPickerProcessedEmailContent } from '@/lib/email/templates';
import { parsePickerFormSchema } from '../schemas/form';
import { getDisqualificationReason } from '../schemas/public-picker';
import { environment } from '@/lib/environment';

export const processPickerJobs = procedure()
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
      include: PICKER_JOB_FORM_INCLUDE
    });

    console.info(`Found ${jobs.length} picker jobs to process`);
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

export const PICKER_JOB_FORM_INCLUDE = {
  children: true,
  picker: {
    include: {
      form: {
        select: {
          data: true
        }
      },
      team: true
    }
  }
} satisfies Prisma.PickerJobInclude;

export type PickerJobWithForm = Prisma.PickerJobGetPayload<{
  include: typeof PICKER_JOB_FORM_INCLUDE;
}>;

const processJob = async (db: PrismaClient, job: PickerJobWithForm) => {
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
  job: PickerJobWithForm
) => {
  const someChildrenFailed = job.children.some(
    (child) => child.status === PickerJobStatus.FAILED
  );

  if (someChildrenFailed) {
    await db.$transaction(async (tx) => {
      await tx.pickerJob.update({
        where: { id: job.id },
        data: {
          status: PickerJobStatus.FAILED
        }
      });

      await tx.picker.update({
        where: { id: job.pickerId },
        data: {
          status: PickerStatus.FAILED
        }
      });

      await tx.pickerAuditLog.createMany({
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

  const data = toTwitterData(job);
  const form = parsePickerFormSchema(job.picker.form, { validate: true });

  if (
    someChildrenPending &&
    form.timing?.endDate &&
    new Date() < new Date(form.timing.endDate)
  ) {
    // re-queue the job for later
    await db.pickerJob.update({
      where: { id: job.id },
      data: {
        status: PickerJobStatus.QUEUED,
        runAt: datetime.minutesFromNow(10),
        data
      }
    });
    return;
  }

  await db.$transaction(async (tx) => {
    await tx.pickerJob.update({
      where: { id: job.id },
      data: {
        status: PickerJobStatus.COMPLETED,
        data
      }
    });
    await tx.pickerJob.updateMany({
      where: {
        parentId: job.id,
        status: { in: [PickerJobStatus.QUEUED, PickerJobStatus.RUNNING] }
      },
      data: {
        status: PickerJobStatus.CANCELLED
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
        }
      ]
    });
  });

  await sendPickerReadyEmail(db, job.pickerId, data);
};

const processFetchTwitterGetLikingUsersJob = async (
  db: PrismaClient,
  job: PickerJobWithForm
) =>
  await twitterJobProcessor(
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
  await twitterJobProcessor(
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
  await twitterJobProcessor(
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

const twitterJobProcessor = async <
  T extends { meta?: { next_token?: string } }
>(
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

      if (request.polling) {
        await tx.pickerJob.create({
          data: {
            pickerId: job.pickerId,
            parentId: job.parentId,
            type: job.type,
            status: PickerJobStatus.QUEUED,
            runAt: datetime.hoursFromNow(1.5),
            data: toTwitterFetchRequest({
              tweetId: request.tweetId,
              polling: true
            })
          }
        });
      } else if (response.meta?.next_token) {
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

const sendPickerReadyEmail = async (
  db: PrismaClient,
  pickerId: string,
  data: FetchTwitterDataSchema
) => {
  const picker = await db.picker.findUnique({
    where: { id: pickerId },
    include: {
      form: {
        select: { data: true }
      },
      team: {
        include: {
          members: {
            where: { role: 'OWNER' },
            include: {
              user: true
            }
          }
        }
      }
    }
  });

  if (!picker) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: 'Picker not found'
    });
  }

  const owner = picker.team.members.find((m) => m.role === 'OWNER');
  if (!owner?.user.email) {
    console.warn(
      `No owner email found for picker ${picker.id}, skipping email notification`
    );
    return;
  }

  const form = parsePickerFormSchema(picker.form, { validate: true });

  const eligibleUsers = data.users.filter(
    (user) => !getDisqualificationReason(user, form)
  );

  const baseUrl = environment.appUrl();
  const pickerUrl = `${baseUrl}/app/${picker.team.slug}/pickers/${picker.id}/draw`;

  try {
    const emailClient = newEmailClient({
      secret: process.env.INBOUND_SECRET
    });

    const emailContent = getPickerProcessedEmailContent({
      pickerName: form.setup.name,
      totalParticipants: data.users.length,
      eligibleParticipants: eligibleUsers.length,
      verificationUrl: pickerUrl,
      name: owner.user.name || undefined
    });

    await emailClient.send({
      to: owner.user.email,
      from: NO_REPLY_EMAIL,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });

    console.info(
      `Sent picker ready email to ${owner.user.email} for picker ${picker.id}`
    );
  } catch (error) {
    console.error(
      `Failed to send picker ready email for picker ${picker.id}`,
      error
    );
  }
};
