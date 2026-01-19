import { NextResponse } from 'next/server';
import { DiscordApplicationCommandInteractionSchema } from '../schema';
import { toDeferredEphemeralChannelMessage } from '../messages';
import { scheduleDiscordJob } from '../jobs';

export const handleApplicationCommandRequest = async ({
  body
}: {
  body: DiscordApplicationCommandInteractionSchema;
}) => {
  void scheduleDiscordJob(body);
  return NextResponse.json(
    toDeferredEphemeralChannelMessage(
      'Processing your request... Please wait a few seconds and do not close this message.'
    )
  );
};
