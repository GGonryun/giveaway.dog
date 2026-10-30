import 'server-only';

import { ApplicationError, assertNever } from '@giveaway/util-errors';
import {
  AutomatedPostJobStatus,
  Prisma,
  PrismaClient,
  SweepstakesStatus
} from '@giveaway/db-model';
import {
  PostToTwitterJobSchema,
  PostToBlueskyJobSchema,
  toAutomatedPostJobSchema
} from '@giveaway/automation-model/schemas';
import { createTweet } from '@giveaway/x-api/create-tweet';
import { createSkeet } from '@giveaway/bluesky-api/create-skeet';
import { toDefaultValues } from '@giveaway/task-model/defaults';
import { nanoid } from 'nanoid';
import {
  StorableTaskSchema,
  toStorableTask
} from '@giveaway/sweepstakes-model/storable';

import { processPostToDiscord } from '@giveaway/discord-connect/process-post-to-discord';
import { toJobRetryAt } from '@giveaway/jobs/retry';

const MAX_JOBS_PER_RUN = 5;
const STUCK_JOB_TIMEOUT_MS = 10 * 60 * 1000;

export const runAutomatedPostJobs = async (
  db: PrismaClient,
  { sweepstakesId }: { sweepstakesId?: string } = {}
) => {
  const now = new Date();

  await db.automatedPostJob.updateMany({
    where: {
      status: AutomatedPostJobStatus.IN_PROGRESS,
      updatedAt: {
        lt: new Date(now.getTime() - STUCK_JOB_TIMEOUT_MS)
      },
      ...(sweepstakesId ? { sweepstakesId } : {})
    },
    data: {
      status: AutomatedPostJobStatus.PENDING
    }
  });

  const pending = await db.automatedPostJob.findMany({
    where: {
      runAt: {
        lte: now
      },
      status: {
        in: ['PENDING']
      },
      ...(sweepstakesId ? { sweepstakesId } : {})
    },
    orderBy: {
      createdAt: 'asc'
    },
    take: MAX_JOBS_PER_RUN
  });

  console.info(`Found ${pending.length} automated post jobs to process`);
  let processed = 0;
  for (const job of pending) {
    const { count } = await db.automatedPostJob.updateMany({
      where: {
        id: job.id,
        status: AutomatedPostJobStatus.PENDING,
        runAt: { lte: now }
      },
      data: {
        status: AutomatedPostJobStatus.IN_PROGRESS
      }
    });
    if (count === 0) continue;
    processed++;
    try {
      await processAutomatedPostJob({ db, job });
    } catch (error) {
      try {
        await recordAutomatedPostJobFailure({ db, job, error });
      } catch (recordError) {
        console.error(
          `Failed to record the failure of automated post job ${job.id}`,
          recordError
        );
      }
    }
  }

  return {
    processed
  };
};

const recordAutomatedPostJobFailure = async ({
  db,
  job,
  error
}: {
  db: PrismaClient;
  job: Prisma.AutomatedPostJobGetPayload<{}>;
  error: unknown;
}) => {
  const retryAt = toJobRetryAt({ error, attempts: job.attempts });
  const stored = await db.automatedPostJob.findUnique({
    where: { id: job.id },
    select: { response: true }
  });
  const response = {
    ...(stored?.response as Prisma.JsonObject | null | undefined),
    error: ApplicationError.toMessage(error)
  };

  if (retryAt) {
    console.warn(
      `Retrying automated post job ${job.id} at ${retryAt.toISOString()}`,
      error
    );
    await db.automatedPostJob.update({
      where: { id: job.id },
      data: {
        status: AutomatedPostJobStatus.PENDING,
        runAt: retryAt,
        attempts: { increment: 1 },
        response
      }
    });
    return;
  }

  console.error(`Failed to process automated post job ${job.id}`, error);
  await db.automatedPostJob.update({
    where: { id: job.id },
    data: {
      status: AutomatedPostJobStatus.FAILED,
      attempts: { increment: 1 },
      response
    }
  });
};

async function processAutomatedPostJob({
  db,
  job
}: {
  db: PrismaClient;
  job: Prisma.AutomatedPostJobGetPayload<{}>;
}) {
  const parsed = toAutomatedPostJobSchema(job);

  const timing = await db.sweepstakesTiming.findUnique({
    where: { sweepstakesId: job.sweepstakesId },
    select: { startDate: true }
  });

  if (timing?.startDate && timing.startDate > new Date()) {
    await db.automatedPostJob.update({
      where: { id: job.id },
      data: {
        status: AutomatedPostJobStatus.PENDING,
        runAt: timing.startDate
      }
    });
    console.info(
      `Sweepstakes ${job.sweepstakesId} has not started yet, rescheduling automated post job ${job.id}`
    );
    return;
  }

  switch (parsed.type) {
    case 'POST_TO_TWITTER':
      return processPostToTwitter({ db, job: parsed });
    case 'POST_TO_BLUESKY':
      return processPostToBluesky({ db, job: parsed });
    case 'POST_TO_DISCORD':
      return processPostToDiscord({ db, job: parsed });
    default:
      throw assertNever(parsed);
  }
}

const findSweepstakesToPost = async (
  db: PrismaClient,
  sweepstakesId: string
) => {
  const sweepstakes = await db.sweepstakes.findUnique({
    where: { id: sweepstakesId },
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

  return { ...sweepstakes, teamId: sweepstakes.teamId };
};

const completePostJob = async ({
  db,
  jobId,
  sweepstakesId,
  tasks,
  response
}: {
  db: PrismaClient;
  jobId: string;
  sweepstakesId: string;
  tasks: StorableTaskSchema[];
  response: Prisma.InputJsonObject;
}) => {
  await db.$transaction(async (tx) => {
    await tx.sweepstakes.update({
      where: { id: sweepstakesId },
      data: {
        tasks: {
          create: tasks.map((task) =>
            toStorableTask(task, SweepstakesStatus.ACTIVE)
          )
        }
      }
    });

    await tx.automatedPostJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        response
      }
    });
  });
};

const postTweet = async ({
  db,
  job,
  teamId
}: {
  db: PrismaClient;
  job: PostToTwitterJobSchema;
  teamId: string;
}) => {
  if (job.response?.tweetId && job.response.tweetUrl) {
    return { tweetId: job.response.tweetId, tweetUrl: job.response.tweetUrl };
  }

  const integration = await db.integration.findFirst({
    where: {
      id: job.request.integrationId,
      teamId,
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
    teamId,
    integrationId: job.request.integrationId,
    text: job.request.text,
    imageUrl: job.request.imageUrl
  });

  const tweetId = tweetResult.data.id;
  const tweetUrl = `https://x.com/${integration.label}/status/${tweetId}`;

  await db.automatedPostJob.update({
    where: { id: job.id },
    data: { response: { tweetId, tweetUrl } }
  });

  return { tweetId, tweetUrl };
};

const processPostToTwitter = async ({
  db,
  job
}: {
  db: PrismaClient;
  job: PostToTwitterJobSchema;
}) => {
  const sweepstakes = await findSweepstakesToPost(db, job.sweepstakesId);

  const { tweetId, tweetUrl } = await postTweet({
    db,
    job,
    teamId: sweepstakes.teamId
  });

  const newTasks: StorableTaskSchema[] = [];

  if (job.request.tasks.includes('REPOST')) {
    newTasks.push({
      ...toDefaultValues('TWITTER_RETWEET_IMPORT_V2'),
      id: nanoid(),
      index: sweepstakes.tasks.length,
      tweetId: tweetUrl
    });
  }

  await completePostJob({
    db,
    jobId: job.id,
    sweepstakesId: sweepstakes.id,
    tasks: newTasks,
    response: { tweetId, tweetUrl }
  });

  console.info(
    `[processPostToTwitter] Successfully posted tweet ${tweetId} for job ${job.id}`
  );
};

const postSkeet = async ({
  db,
  job,
  teamId
}: {
  db: PrismaClient;
  job: PostToBlueskyJobSchema;
  teamId: string;
}) => {
  if (job.response?.postUri && job.response.postUrl) {
    return { postUri: job.response.postUri, postUrl: job.response.postUrl };
  }

  const integration = await db.integration.findFirst({
    where: {
      id: job.request.integrationId,
      teamId,
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
    teamId,
    text: job.request.text,
    imageUrl: job.request.imageUrl
  });

  const postUri = skeetResult.uri;
  const postUrl = `https://bsky.app/profile/${integration.account_id}/post/${postUri.split('/').pop()}`;

  await db.automatedPostJob.update({
    where: { id: job.id },
    data: { response: { postUri, postUrl } }
  });

  return { postUri, postUrl };
};

const processPostToBluesky = async ({
  db,
  job
}: {
  db: PrismaClient;
  job: PostToBlueskyJobSchema;
}) => {
  const sweepstakes = await findSweepstakesToPost(db, job.sweepstakesId);

  const { postUri, postUrl } = await postSkeet({
    db,
    job,
    teamId: sweepstakes.teamId
  });

  let index = sweepstakes.tasks.length;
  const newTasks: StorableTaskSchema[] = [];

  if (job.request.tasks.includes('REPOST')) {
    newTasks.push({
      ...toDefaultValues('BLUESKY_REPOST_IMPORT'),
      id: nanoid(),
      index,
      postUrl,
      importingAccount: job.request.integrationId
    });
    index++;
  }

  if (job.request.tasks.includes('LIKE')) {
    newTasks.push({
      ...toDefaultValues('BLUESKY_LIKE_IMPORT'),
      id: nanoid(),
      index,
      postUrl,
      importingAccount: job.request.integrationId
    });
  }

  await completePostJob({
    db,
    jobId: job.id,
    sweepstakesId: sweepstakes.id,
    tasks: newTasks,
    response: { postUri, postUrl }
  });

  console.info(
    `[processPostToBluesky] Successfully posted to Bluesky ${postUri} for job ${job.id}`
  );
};
