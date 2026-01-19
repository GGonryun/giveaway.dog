import { ApplicationError, assertNever } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';
import { verifyDiscordRequest } from '../verify';
import { handlePingCommand } from './ping';
import { handleApplicationCommandRequest } from './application';
import { toEphemeralChannelMessage } from '../messages';

export const POST = async (request: NextRequest) => {
  try {
    const body = await verifyDiscordRequest(request);

    switch (body.type) {
      case 1: // PING
        return handlePingCommand();
      case 2: // APPLICATION_COMMAND
        return handleApplicationCommandRequest({ body });
      default:
        throw assertNever(body);
    }
  } catch (error) {
    console.error('Discord interaction error:', error);

    if (error instanceof ApplicationError) {
      switch (error.code) {
        case 'UNAUTHORIZED':
        case 'FORBIDDEN':
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        case 'BAD_REQUEST':
        case 'CONFLICT':
        case 'NOT_FOUND':
          return NextResponse.json(toEphemeralChannelMessage(error.message));
      }
    }

    console.error('Failed to handle Discord interaction:', error);
    return NextResponse.json(
      toEphemeralChannelMessage(
        'An unexpected error occurred. Please try again later.'
      )
    );
  }
};
