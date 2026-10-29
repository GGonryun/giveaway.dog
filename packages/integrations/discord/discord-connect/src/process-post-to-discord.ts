import 'server-only';

import { SWEEPSTAKES_DISCORD_POST_SELECT_QUERY } from '@giveaway/automation-model/db';
import {
  asPostToDiscordResponseSchema,
  PostToDiscordJobSchema
} from '@giveaway/automation-model/schemas';
import { ApplicationError } from '@giveaway/util-errors';
import { toDefaultValues } from '@giveaway/task-model/defaults';
import { toStorableTask } from '@giveaway/sweepstakes-model/storable';
import { Prisma, PrismaClient, SweepstakesStatus } from '@giveaway/db-model';
import { nanoid } from 'nanoid';
import { toActiveSweepstakeComponents } from '@giveaway/discord-api/util';
import { postDiscordMessage } from '@giveaway/discord-api/post-discord-message';
import { toSweepstakesEmbed } from '@giveaway/discord-api/embeds';

type DiscordPostSweepstakes = Prisma.SweepstakesGetPayload<{
  select: typeof SWEEPSTAKES_DISCORD_POST_SELECT_QUERY;
}> & { teamId: string };

const postMessage = async ({
  db,
  job,
  sweepstakes
}: {
  db: PrismaClient;
  job: PostToDiscordJobSchema;
  sweepstakes: DiscordPostSweepstakes;
}) => {
  if (job.response?.messageId && job.response.messageUrl) {
    return {
      messageId: job.response.messageId,
      messageUrl: job.response.messageUrl,
      taskId: job.response.taskId
    };
  }

  const integration = await db.integration.findFirst({
    where: {
      id: job.request.integrationId,
      teamId: sweepstakes.teamId,
      provider: 'DISCORD',
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
      message: 'Discord integration not found'
    });
  }

  const guildId = integration.account_id;

  if (!guildId) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: 'Discord guild ID not found'
    });
  }

  const taskId = job.request.tasks.includes('INTERACTION')
    ? nanoid()
    : undefined;

  const messageResponse = await postDiscordMessage({
    channelId: job.request.channelId,
    embed: await toSweepstakesEmbed({
      sweepstakes,
      job,
      db
    }),
    components: toActiveSweepstakeComponents({
      taskId,
      sweepstakes
    })
  });

  const messageId = messageResponse.id;
  const messageUrl = `https://discord.com/channels/${guildId}/${job.request.channelId}/${messageId}`;

  await db.automatedPostJob.update({
    where: { id: job.id },
    data: {
      response: asPostToDiscordResponseSchema({
        channelId: job.request.channelId,
        messageId,
        messageUrl,
        taskId
      })
    }
  });

  return { messageId, messageUrl, taskId };
};

export const processPostToDiscord = async ({
  db,
  job
}: {
  db: PrismaClient;
  job: PostToDiscordJobSchema;
}) => {
  const sweepstakes = await db.sweepstakes.findUnique({
    where: { id: job.sweepstakesId },
    select: SWEEPSTAKES_DISCORD_POST_SELECT_QUERY
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

  const { messageId, messageUrl, taskId } = await postMessage({
    db,
    job,
    sweepstakes: { ...sweepstakes, teamId: sweepstakes.teamId }
  });

  await db.$transaction(async (tx) => {
    if (taskId) {
      const interactionTask = {
        ...toDefaultValues('DISCORD_INTERACTION_IMPORT'),
        id: taskId,
        index: sweepstakes.tasks.length,
        importingAccount: job.request.integrationId,
        roles: job.request.roles,
        link: messageUrl
      };

      await tx.sweepstakes.update({
        where: { id: sweepstakes.id },
        data: {
          tasks: {
            create: toStorableTask(interactionTask, SweepstakesStatus.ACTIVE)
          }
        }
      });
    }

    await tx.automatedPostJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        response: asPostToDiscordResponseSchema({
          channelId: job.request.channelId,
          messageId,
          messageUrl,
          taskId
        })
      }
    });
  });

  console.info(
    `[processPostToDiscord] Successfully posted message ${messageId} for job ${job.id}`
  );
};
