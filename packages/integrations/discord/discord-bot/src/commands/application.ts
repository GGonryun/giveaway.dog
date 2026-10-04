import 'server-only';

import { NextResponse } from 'next/server';
import { DiscordApplicationCommandInteractionSchema } from '@giveaway/discord-model/schema';
import { toDeferredEphemeralChannelMessage } from '../messages';
import { start } from 'workflow/api';
import { discordConnectWorkflow } from '../workflows/discord-connect/workflow';

export const handleApplicationCommandRequest = async ({
  body
}: {
  body: DiscordApplicationCommandInteractionSchema;
}) => {
  void start(discordConnectWorkflow, [{ body }]);
  return NextResponse.json(
    toDeferredEphemeralChannelMessage(
      'Processing your request... Please wait a few seconds and do not close this message.'
    )
  );
};
