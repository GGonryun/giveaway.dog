import { assertNever } from '@/lib/errors';
import { NextRequest } from 'next/server';
import { verifyDiscordRequest } from '../verify';
import { handlePingCommand } from './ping';
import { handleApplicationCommandRequest } from './application';

export const POST = async (request: NextRequest) => {
  const body = await verifyDiscordRequest(request);

  switch (body.type) {
    case 1: // PING
      return handlePingCommand();
    case 2: // APPLICATION_COMMAND
      return handleApplicationCommandRequest({ body });
    default:
      throw assertNever(body);
  }
};
