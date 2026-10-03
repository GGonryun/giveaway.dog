import { SWEEPSTAKES_DISCORD_POST_SELECT_QUERY } from '@/lib/automation/db';
import {
  asPostToDiscordResponseSchema,
  PostToDiscordJobSchema
} from '@/lib/automation/schemas';
import { ApplicationError } from '@giveaway/util-errors';
import { toDefaultValues } from '@/lib/task/defaults';
import { toStorableTask } from '@/schemas/giveaway/storable';
import { PrismaClient, SweepstakesStatus } from '@prisma/client';
import { nanoid } from 'nanoid';
import { toActiveSweepstakeComponents } from '../api/util';
import { postDiscordMessage } from '../api/post-discord-message';
import { toSweepstakesEmbed } from '../embeds';

export const processPostToDiscord = async ({
  db,
  job
}: {
  db: PrismaClient;
  job: PostToDiscordJobSchema;
}) => {
  try {
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

    let taskId: string | undefined;

    if (job.request.tasks.includes('INTERACTION')) {
      taskId = nanoid();
    }

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

    const messageUrl = `https://discord.com/channels/${guildId}/${job.request.channelId}/${messageResponse.id}`;

    if (taskId) {
      const interactionTask = {
        ...toDefaultValues('DISCORD_INTERACTION_IMPORT'),
        id: taskId,
        index: sweepstakes.tasks.length,
        importingAccount: job.request.integrationId,
        roles: job.request.roles,
        link: messageUrl
      };

      await db.sweepstakes.update({
        where: { id: sweepstakes.id },
        data: {
          tasks: {
            create: toStorableTask(interactionTask, SweepstakesStatus.ACTIVE)
          }
        }
      });
    }

    await db.automatedPostJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        response: asPostToDiscordResponseSchema({
          channelId: job.request.channelId,
          messageId: messageResponse.id,
          messageUrl
        })
      }
    });

    console.info(
      `[processPostToDiscord] Successfully posted message ${messageResponse.id} for job ${job.id}`
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
