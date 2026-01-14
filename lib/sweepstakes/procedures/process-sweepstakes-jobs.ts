'use server';

import { ApplicationError } from '@/lib/errors';
import { html } from '@/lib/html';
import { procedure } from '@/lib/mrpc/procedures';
import { DEFAULT_TEAM_NAME } from '@/lib/team/data';
import { DEFAULT_SWEEPSTAKES_NAME } from '@/schemas/giveaway/defaults';
import { Prisma, PrismaClient, SweepstakesJobStatus } from '@prisma/client';
import { z } from 'zod';

const MAX_JOBS_PER_RUN = 10;

export const processSweepstakesJobs = procedure()
  .authorization({ required: false })
  .output(
    z.object({
      processed: z.number()
    })
  )
  .handler(async ({ db }) => {
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
      }
    }

    return {
      processed: pending.length
    };
  });

async function processSweepstakesJob({
  db,
  job
}: {
  db: PrismaClient;
  job: Prisma.SweepstakesJobGetPayload<{}>;
}) {
  switch (job.type) {
    case 'NOTIFY_PUBLISH_ON_DISCORD':
      return processNotifyPublishDiscord({ db, job });
    case 'NOTIFY_PUBLISH_ON_TWITTER':
      throw new ApplicationError({
        code: 'NOT_IMPLEMENTED',
        message: `Sweepstakes job type ${job.type} is not implemented`
      });
    case 'RANDOMLY_ASSIGN_PRIZES':
      return processRandomlyAssignPrizes({ db, job });
    default:
  }
}

const processNotifyPublishDiscord = async ({
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

  const sweepstakesUrl = `${process.env.NEXT_PUBLIC_APP_URL}/browse/${sweepstakes.visibility?.slug ?? sweepstakes.id}`;

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
  const participantsWithoutAllocations = await db.sweepstakesParticipant.findMany({
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
  const allocationsToCreate = participantsWithoutAllocations.map((participant) => {
    const randomPrize = sweepstakes.prizes[
      Math.floor(Math.random() * sweepstakes.prizes.length)
    ];
    return {
      participantId: participant.id,
      prizeId: randomPrize.id
    };
  });

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
