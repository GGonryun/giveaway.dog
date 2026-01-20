import { NextResponse } from 'next/server';
import { toDeferredEphemeralChannelMessage } from '../messages';
import type { DiscordButtonInteractionSchema } from '../schema';
import { scheduleDiscordJob } from '../jobs';
import { toSplitActionId } from '../util';

export async function handleButtonInteraction({
  body
}: {
  body: DiscordButtonInteractionSchema;
}) {
  const { action, operation, taskId } = toSplitActionId(body);

  if (action === 'task') {
    if (operation === 'enter' && taskId) {
      void scheduleDiscordJob(body);
      return NextResponse.json(
        toDeferredEphemeralChannelMessage(
          'Processing your entry... Please wait.'
        )
      );
    } else if (operation === 'distractor') {
      return NextResponse.json(
        toDeferredEphemeralChannelMessage('Oops! Try clicking the Join button.')
      );
    }
  }

  return NextResponse.json(
    toDeferredEphemeralChannelMessage(
      'This button is no longer functional. Please refresh.'
    )
  );
}
