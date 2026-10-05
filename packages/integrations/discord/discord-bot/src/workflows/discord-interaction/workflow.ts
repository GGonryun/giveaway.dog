import 'server-only';

import type { DiscordButtonInteractionSchema } from '@giveaway/discord-model/schema';
import { DISCORD_RESPONSE_FLAG } from '../../messages';
import { fetchTask } from './steps/fetch-task';
import { validateEntry } from './steps/validate-entry';
import { commitEntry } from './steps/commit-entry';
import { patchDiscordWebhook } from './steps/patch-discord-webhook';
import { updateDiscordEmbed } from './steps/update-discord-embed';
import { scheduleRewards } from './steps/schedule-rewards';

export async function discordInteractionWorkflow({
  body,
  taskId
}: {
  body: DiscordButtonInteractionSchema;
  taskId: string;
}) {
  'use workflow';

  const taskResult = await fetchTask({ taskId });

  if (taskResult.status === 'error') {
    await patchDiscordWebhook({
      applicationId: body.application_id,
      token: body.token,
      message: {
        content: taskResult.content,
        flags: DISCORD_RESPONSE_FLAG.EPHEMERAL
      }
    });
    return;
  }

  if (taskResult.status === 'ended') {
    await patchDiscordWebhook({
      applicationId: body.application_id,
      token: body.token,
      message: {
        content: 'This giveaway has already ended.',
        flags: DISCORD_RESPONSE_FLAG.EPHEMERAL
      }
    });
    await updateDiscordEmbed({
      channelId: body.message.channel_id,
      messageId: body.message.id,
      sweepstakesId: taskResult.sweepstakesId
    });
    return;
  }

  const validation = await validateEntry({
    body,
    taskId,
    roles: taskResult.roles,
    sweepstakesId: taskResult.sweepstakesId
  });

  if (!validation.valid) {
    await patchDiscordWebhook({
      applicationId: body.application_id,
      token: body.token,
      message: {
        content: validation.content,
        flags: validation.flags ?? DISCORD_RESPONSE_FLAG.EPHEMERAL
      }
    });
    return;
  }

  await patchDiscordWebhook({
    applicationId: body.application_id,
    token: body.token,
    message: {
      content: 'Your entry is confirmed!',
      flags: DISCORD_RESPONSE_FLAG.EPHEMERAL
    }
  });

  const { userId } = await commitEntry({
    body,
    taskId,
    sweepstakesId: taskResult.sweepstakesId,
    existingUserId: validation.existingUserId,
    member: validation.member,
    discordUserId: validation.discordUserId
  });

  if (body.member) {
    await updateDiscordEmbed({
      channelId: body.message.channel_id,
      messageId: body.message.id,
      sweepstakesId: taskResult.sweepstakesId
    });

    await scheduleRewards({
      sweepstakesId: taskResult.sweepstakesId,
      userId
    });
  }
}
