'use server';

import { ApplicationError, assertNever } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { Prisma, PrismaClient, SweepstakesStatus } from '@prisma/client';
import { z } from 'zod';
import {
  AutomatedPostJobSchema,
  PostToTwitterJobSchema,
  PostToBlueskyJobSchema,
  toAutomatedPostJobSchema
} from '../schemas';
import { createTweet } from '@/lib/integrations/procedures/create-tweet';
import { createSkeet } from '@/lib/integrations/procedures/create-skeet';
import { toDefaultValues } from '@/lib/task/defaults';
import { nanoid } from 'nanoid';
import {
  StorableTaskSchema,
  toStorableTask
} from '@/schemas/giveaway/storable';

const MAX_JOBS_PER_RUN = 10;

export const processAutomatedPostJobs = procedure()
  .authorization({ required: false })
  .output(
    z.object({
      processed: z.number()
    })
  )
  .handler(async ({ db }) => {
    const now = new Date();

    const pending = await db.automatedPostJob.findMany({
      where: {
        runAt: {
          lte: now
        },
        status: {
          in: ['PENDING']
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: MAX_JOBS_PER_RUN
    });

    console.info(`Found ${pending.length} automated post jobs to process`);
    for (const job of pending) {
      try {
        await processAutomatedPostJob({ db, job });
      } catch (error) {
        console.error(`Failed to process automated post job ${job.id}`, error);
      }
    }

    return {
      processed: pending.length
    };
  });

async function processAutomatedPostJob({
  db,
  job
}: {
  db: PrismaClient;
  job: Prisma.AutomatedPostJobGetPayload<{}>;
}) {
  const parsed = toAutomatedPostJobSchema(job);

  switch (parsed.type) {
    case 'POST_TO_TWITTER':
      return processPostToTwitter({ db, job: parsed });
    case 'POST_TO_BLUESKY':
      return processPostToBluesky({ db, job: parsed });
    default:
      throw assertNever(parsed);
  }
}

const processPostToTwitter = async ({
  db,
  job
}: {
  db: PrismaClient;
  job: PostToTwitterJobSchema;
}) => {
  try {
    const sweepstakes = await db.sweepstakes.findUnique({
      where: { id: job.sweepstakesId },
      select: { id: true, tasks: true, teamId: true }
    });

    if (!sweepstakes) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Sweepstakes not found'
      });
    }

    if (!sweepstakes.teamId) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Sweepstakes team not found'
      });
    }

    const integration = await db.integration.findFirst({
      where: {
        id: job.request.integrationId,
        teamId: sweepstakes.teamId,
        provider: 'TWITTER',
        status: 'ACTIVE'
      },
      select: {
        label: true
      }
    });

    if (!integration) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Twitter integration not found'
      });
    }

    const tweetResult = await createTweet(db, {
      teamId: sweepstakes.teamId,
      text: job.request.text,
      imageUrl: job.request.imageUrl
    });

    const tweetId = tweetResult.data.id;
    const tweetUrl = `https://x.com/${integration.label}/status/${tweetId}`;

    let index = sweepstakes.tasks.length;
    const newTasks: StorableTaskSchema[] = [];

    // 5. Add import tasks based on job.request.tasks
    if (job.request.tasks.includes('REPOST')) {
      const retweetImportTask = {
        ...toDefaultValues('TWITTER_RETWEET_IMPORT'),
        id: nanoid(),
        index,
        tweetId: tweetUrl,
        importingAccount: job.request.integrationId
      };
      newTasks.push(retweetImportTask);
      index++;
    }

    if (job.request.tasks.includes('LIKE')) {
      const likeImportTask = {
        ...toDefaultValues('TWITTER_LIKE_IMPORT'),
        id: nanoid(),
        index,
        tweetId: tweetUrl,
        importingAccount: job.request.integrationId
      };
      newTasks.push(likeImportTask);
      index++;
    }

    await db.sweepstakes.update({
      where: { id: sweepstakes.id },
      data: {
        tasks: {
          create: newTasks.map((task) =>
            toStorableTask(task, SweepstakesStatus.ACTIVE)
          )
        }
      }
    });

    await db.automatedPostJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        response: {
          tweetId,
          tweetUrl
        }
      }
    });

    console.info(
      `[processPostToTwitter] Successfully posted tweet ${tweetId} for job ${job.id}`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    await db.automatedPostJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        response: {
          error: errorMessage
        }
      }
    });

    throw error;
  }
};

const processPostToBluesky = async ({
  db,
  job
}: {
  db: PrismaClient;
  job: PostToBlueskyJobSchema;
}) => {
  try {
    const sweepstakes = await db.sweepstakes.findUnique({
      where: { id: job.sweepstakesId },
      select: { id: true, tasks: true, teamId: true }
    });

    if (!sweepstakes) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Sweepstakes not found'
      });
    }

    if (!sweepstakes.teamId) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Sweepstakes team not found'
      });
    }

    const integration = await db.integration.findFirst({
      where: {
        id: job.request.integrationId,
        teamId: sweepstakes.teamId,
        provider: 'BLUESKY',
        status: 'ACTIVE'
      },
      select: {
        label: true,
        account_id: true
      }
    });

    if (!integration) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Bluesky integration not found'
      });
    }

    const skeetResult = await createSkeet(db, {
      teamId: sweepstakes.teamId,
      text: job.request.text,
      imageUrl: job.request.imageUrl
    });

    const postUri = skeetResult.uri;
    const postUrl = `https://bsky.app/profile/${integration.account_id}/post/${postUri.split('/').pop()}`;

    let index = sweepstakes.tasks.length;
    const newTasks: StorableTaskSchema[] = [];

    if (job.request.tasks.includes('REPOST')) {
      const repostImportTask = {
        ...toDefaultValues('BLUESKY_REPOST_IMPORT'),
        id: nanoid(),
        index,
        postUrl: postUrl,
        importingAccount: job.request.integrationId
      };
      newTasks.push(repostImportTask);
      index++;
    }

    if (job.request.tasks.includes('LIKE')) {
      const likeImportTask = {
        ...toDefaultValues('BLUESKY_LIKE_IMPORT'),
        id: nanoid(),
        index,
        postUrl: postUrl,
        importingAccount: job.request.integrationId
      };
      newTasks.push(likeImportTask);
      index++;
    }

    await db.sweepstakes.update({
      where: { id: sweepstakes.id },
      data: {
        tasks: {
          create: newTasks.map((task) =>
            toStorableTask(task, SweepstakesStatus.ACTIVE)
          )
        }
      }
    });

    await db.automatedPostJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        response: {
          postUri,
          postUrl
        }
      }
    });

    console.info(
      `[processPostToBluesky] Successfully posted to Bluesky ${postUri} for job ${job.id}`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    await db.automatedPostJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        response: {
          error: errorMessage
        }
      }
    });

    throw error;
  }
};
