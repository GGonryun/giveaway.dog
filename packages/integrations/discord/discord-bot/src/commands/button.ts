import 'server-only';

import { NextResponse } from 'next/server';
import { toDeferredEphemeralChannelMessage } from '../messages';
import type { DiscordButtonInteractionSchema } from '@giveaway/discord-model/schema';
import { toSplitActionId } from '../util';
import { start } from 'workflow/api';
import { discordInteractionWorkflow } from '../workflows/discord-interaction/workflow';

export async function handleButtonInteraction({
  body
}: {
  body: DiscordButtonInteractionSchema;
}) {
  const { action, taskId } = toSplitActionId(body);

  if (action === 'task') {
    void start(discordInteractionWorkflow, [{ body, taskId }]);
    return NextResponse.json(
      toDeferredEphemeralChannelMessage('Processing your entry... Please wait.')
    );
  }

  return NextResponse.json(
    toDeferredEphemeralChannelMessage(
      'This button is no longer functional. Please refresh.'
    )
  );
}
