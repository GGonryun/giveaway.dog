'use server';

import { ApplicationError, assertNever } from '@giveaway/util-errors';
import { html } from '@giveaway/util-html/html';
import { DEFAULT_TEAM_NAME } from '@giveaway/team-model/team/data';
import { DEFAULT_SWEEPSTAKES_NAME } from '@giveaway/app-config/settings';
import {
  Prisma,
  PrismaClient,
  SweepstakesJobStatus,
  VisibilityType
} from '@prisma/client';
import { toSweepstakesUrl } from '@giveaway/sweepstakes-model/util';
import db from '@giveaway/db-client/prisma';
import { updateDiscordMessage } from '@/lib/discord/api/update-discord-message';
import { toPostToDiscordResponseSchema } from '@giveaway/automation-model/schemas';
import { SWEEPSTAKES_DISCORD_POST_SELECT_QUERY } from '@giveaway/automation-model/db';
import { toSweepstakesEmbed } from '@/lib/discord/embeds';
import { toExpiredSweepstakeComponents } from '@/lib/discord/api/util';

const MAX_JOBS_PER_RUN = 5;

export const processSweepstakesJobs = async () => {
  const now = new Date();

  const pending = await db.sweepstakesJob.findMany({
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

  console.info(`Found ${pending.length} sweepstakes jobs to process`);

  for (const job of pending) {
    try {
      await processSweepstakesJob({ db, job });
    } catch (error) {
      console.error(`Failed to process sweepstakes job ${job.id}`, error);
      await db.sweepstakesJob.update({
        where: { id: job.id },
        data: {
          status: SweepstakesJobStatus.FAILED,
          error: ApplicationError.toMessage(error)
        }
      });
    }
  }

  return {
    processed: pending.length
  };
};

async function processSweepstakesJob({
  db,
  job
}: {
  db: PrismaClient;
  job: Prisma.SweepstakesJobGetPayload<{}>;
}) {
  switch (job.type) {
    case 'PROCESS_ACTIVATION':
      return processSweepstakesActivation({ db, job });
    case 'PROCESS_MODIFICATION':
      return processSweepstakesModification({ db, job });
    case 'PROCESS_EXPIRATION':
      return processSweepstakesExpiration({ db, job });
    case 'PROCESS_COMPLETION':
      return processSweepstakesCompletion({ db, job });
    case 'RANDOMLY_ASSIGN_PRIZES':
      return processRandomlyAssignPrizes({ db, job });
    default:
      throw assertNever(job.type);
  }
}

const processRandomlyAssignPrizes = async ({
  db,
  job
}: {
  db: PrismaClient;
  job: Prisma.SweepstakesJobGetPayload<{}>;
}) => {
  const sweepstakes = await db.sweepstakes.findUnique({
    where: { id: job.sweepstakesId },
    select: {
      criteria: true,
      prizes: { select: { id: true } }
    }
  });

  if (!sweepstakes) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: `Sweepstakes with id ${job.sweepstakesId} not found`
    });
  }

  const shouldAssignPrizes =
    sweepstakes.criteria?.allowUserSelection === true &&
    sweepstakes.prizes.length > 0;

  if (!shouldAssignPrizes) {
    console.info(
      `Sweepstakes ${job.sweepstakesId} does not require random prize assignment`
    );
    await db.sweepstakesJob.update({
      where: { id: job.id },
      data: { status: SweepstakesJobStatus.COMPLETED }
    });
    return;
  }

  // Find participants without allocations
  const participantsWithoutAllocations =
    await db.sweepstakesParticipant.findMany({
      where: {
        sweepstakesId: job.sweepstakesId,
        allocations: null
      },
      select: {
        id: true
      }
    });

  if (participantsWithoutAllocations.length === 0) {
    console.info(
      `No participants without allocations for sweepstakes ${job.sweepstakesId}`
    );
    await db.sweepstakesJob.update({
      where: { id: job.id },
      data: { status: SweepstakesJobStatus.COMPLETED }
    });
    return;
  }

  // Create random allocations
  const allocationsToCreate = participantsWithoutAllocations.map(
    (participant) => {
      const randomPrize =
        sweepstakes.prizes[
          Math.floor(Math.random() * sweepstakes.prizes.length)
        ];
      return {
        participantId: participant.id,
        prizeId: randomPrize.id
      };
    }
  );

  await db.sweepstakesAllocation.createMany({
    data: allocationsToCreate,
    skipDuplicates: true
  });

  await db.sweepstakesJob.update({
    where: { id: job.id },
    data: { status: SweepstakesJobStatus.COMPLETED }
  });

  console.info(
    `Successfully assigned random prizes to ${allocationsToCreate.length} participants for sweepstakes ${job.sweepstakesId}`
  );
};

const processSweepstakesActivation = async ({
  db,
  job
}: {
  db: PrismaClient;
  job: Prisma.SweepstakesJobGetPayload<{}>;
}) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'DISCORD_WEBHOOK_URL environment variable is not set'
    });
  }

  const sweepstakes = await db.sweepstakes.findUnique({
    where: { id: job.sweepstakesId },
    include: {
      details: true,
      timing: true,
      visibility: true,
      team: true
    }
  });

  if (!sweepstakes) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: `Sweepstakes with id ${job.sweepstakesId} not found`
    });
  }

  if (sweepstakes.visibility?.visibility !== VisibilityType.PUBLIC) {
    await db.sweepstakesJob.update({
      where: { id: job.id },
      data: { status: SweepstakesJobStatus.COMPLETED }
    });
    console.info(
      `Sweepstakes ${sweepstakes.id} is not public, skipping Discord notification`
    );
    return;
  }

  // if the sweepstakes end date has already been reached
  // complete job.
  if (
    sweepstakes.timing?.endDate &&
    new Date(sweepstakes.timing.endDate) <= new Date()
  ) {
    await db.sweepstakesJob.update({
      where: { id: job.id },
      data: { status: SweepstakesJobStatus.COMPLETED }
    });
    console.info(
      `Sweepstakes ${sweepstakes.id} has already ended, completing job`
    );
    return;
  }

  // if the sweepstakes start date hasn't been reached
  // reschedule job for the future
  if (
    sweepstakes.timing?.startDate &&
    new Date(sweepstakes.timing.startDate) > new Date()
  ) {
    await db.sweepstakesJob.update({
      where: { id: job.id },
      data: {
        status: SweepstakesJobStatus.PENDING,
        runAt: sweepstakes.timing.startDate
      }
    });
    console.info(
      `Sweepstakes ${sweepstakes.id} has not started yet, rescheduling job`
    );
    return;
  }

  const sweepstakesUrl = toSweepstakesUrl({ sweepstakes, forcePath: true });

  const description = sweepstakes.details?.description
    ? html.toMarkdown(sweepstakes.details.description)
    : 'A new sweepstakes has been published';

  const embed: {
    title: string;
    description: string;
    fields: Array<{ name: string; value: string; inline: boolean }>;
    url: string;
    color: number;
    timestamp: string;
    image?: { url: string };
  } = {
    title: sweepstakes.details?.name || DEFAULT_SWEEPSTAKES_NAME,
    description: description.slice(0, 4096),
    fields: [
      {
        name: 'Host',
        value: sweepstakes.team?.name || DEFAULT_TEAM_NAME,
        inline: true
      },
      {
        name: 'Ends At',
        value: sweepstakes.timing?.endDate
          ? new Date(sweepstakes.timing.endDate).toLocaleDateString()
          : 'Not set',
        inline: true
      }
    ],
    url: sweepstakesUrl,
    color: 0x5865f2,
    timestamp: new Date().toISOString()
  };

  if (sweepstakes.details?.banner) {
    embed.image = {
      url: sweepstakes.details.banner
    };
  }

  const payload = {
    embeds: [embed]
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to send Discord webhook: ${response.status} ${response.statusText}`
    });
  }

  await db.sweepstakesJob.update({
    where: { id: job.id },
    data: { status: SweepstakesJobStatus.COMPLETED }
  });

  console.info(
    `Successfully sent Discord notification for sweepstakes ${sweepstakes.id}`
  );
};

const processSweepstakesModification = async ({
  db,
  job
}: {
  db: PrismaClient;
  job: Prisma.SweepstakesJobGetPayload<{}>;
}) => {
  // instantly complete for now, not used
  await db.sweepstakesJob.update({
    where: { id: job.id },
    data: { status: SweepstakesJobStatus.COMPLETED }
  });
};

const processSweepstakesExpiration = async ({
  db,
  job
}: {
  db: PrismaClient;
  job: Prisma.SweepstakesJobGetPayload<{}>;
}) => {
  const sweepstakes = await db.sweepstakes.findUnique({
    where: { id: job.sweepstakesId },
    select: SWEEPSTAKES_DISCORD_POST_SELECT_QUERY
  });

  if (!sweepstakes) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: `Sweepstakes with id ${job.sweepstakesId} not found`
    });
  }

  if (sweepstakes.status === 'COMPLETED') {
    throw new ApplicationError({
      code: 'CONFLICT',
      message: `Sweepstakes ${sweepstakes.id} is already expired`
    });
  }

  if (sweepstakes.status === 'DRAFT') {
    throw new ApplicationError({
      code: 'CONFLICT',
      message: `Sweepstakes ${sweepstakes.id} is still in draft status and cannot process expiration`
    });
  }

  // if there is a post to discord, update the message to indicate the sweepstakes has ended
  const post = sweepstakes.posts.find((p) => p.type === 'POST_TO_DISCORD');
  if (post?.status === 'COMPLETED') {
    // then we need to update the message to say the giveaway has expired.
    console.info(
      `Updating Discord message for sweepstakes ${sweepstakes.id} to indicate expiration`
    );

    const response = toPostToDiscordResponseSchema(post.response);
    if (!response.channelId) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Post to Discord job for sweepstakes ${sweepstakes.id} is missing channelId in response`
      });
    }

    if (!response.messageId) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Post to Discord job for sweepstakes ${sweepstakes.id} is missing messageId in response`
      });
    }

    await updateDiscordMessage({
      channelId: response.channelId,
      messageId: response.messageId,
      embed: await toSweepstakesEmbed({
        sweepstakes,
        db
      }),
      components: toExpiredSweepstakeComponents({
        sweepstakes
      })
    });
  }

  await db.sweepstakesJob.update({
    where: { id: job.id },
    data: { status: SweepstakesJobStatus.COMPLETED }
  });
};

const processSweepstakesCompletion = async ({
  db,
  job
}: {
  db: PrismaClient;
  job: Prisma.SweepstakesJobGetPayload<{}>;
}) => {
  // For now, completing a sweepstakes is just marking the job as completed.
  // Additional logic can be added here as needed.
  await db.sweepstakesJob.update({
    where: { id: job.id },
    data: { status: SweepstakesJobStatus.COMPLETED }
  });

  console.info(
    `Sweepstakes ${job.sweepstakesId} marked as completed in job ${job.id}`
  );

  const sweepstakes = await db.sweepstakes.findUnique({
    where: { id: job.sweepstakesId },
    select: SWEEPSTAKES_DISCORD_POST_SELECT_QUERY
  });

  if (!sweepstakes) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: `Sweepstakes with id ${job.sweepstakesId} not found`
    });
  }

  if (sweepstakes.status !== 'COMPLETED') {
    throw new ApplicationError({
      code: 'CONFLICT',
      message: `Sweepstakes ${sweepstakes.id} is not completed yet`
    });
  }

  // if there is a post to discord, update the message to indicate the sweepstakes has ended
  const post = sweepstakes.posts.find((p) => p.type === 'POST_TO_DISCORD');
  if (post?.status === 'COMPLETED') {
    // then we need to update the message to say the giveaway has expired.
    console.info(
      `Updating Discord message for sweepstakes ${sweepstakes.id} to indicate expiration`
    );

    const response = toPostToDiscordResponseSchema(post.response);
    if (!response.channelId) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Post to Discord job for sweepstakes ${sweepstakes.id} is missing channelId in response`
      });
    }

    if (!response.messageId) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Post to Discord job for sweepstakes ${sweepstakes.id} is missing messageId in response`
      });
    }

    await updateDiscordMessage({
      channelId: response.channelId,
      messageId: response.messageId,
      embed: await toSweepstakesEmbed({
        sweepstakes,
        db
      }),
      components: toExpiredSweepstakeComponents({ sweepstakes })
    });
  }

  await db.sweepstakesJob.update({
    where: { id: job.id },
    data: { status: SweepstakesJobStatus.COMPLETED }
  });
};
