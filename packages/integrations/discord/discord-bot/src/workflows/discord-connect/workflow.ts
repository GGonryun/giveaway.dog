import 'server-only';

import type { DiscordApplicationCommandInteractionSchema } from '@giveaway/discord-model/schema';
import { processConnect } from './steps/process-connect';
import { patchDiscordWebhook } from '../discord-interaction/steps/patch-discord-webhook';

export async function discordConnectWorkflow({
  body
}: {
  body: DiscordApplicationCommandInteractionSchema;
}) {
  'use workflow';

  const result = await processConnect({ body });

  await patchDiscordWebhook({
    applicationId: body.application_id,
    token: body.token,
    message: result
  });
}
