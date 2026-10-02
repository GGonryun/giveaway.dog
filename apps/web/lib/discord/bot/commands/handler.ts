import { ApplicationError, assertNever } from '@giveaway/util-errors';
import { NextRequest, NextResponse } from 'next/server';
import { verifyDiscordRequest } from '../verify';
import { toEphemeralChannelMessage } from '../messages';

export const POST = async (request: NextRequest) => {
  try {
    const body = await verifyDiscordRequest(request);

    switch (body.type) {
      case 1: {
        // PING
        const { handlePingCommand } = await import('./ping');
        return handlePingCommand();
      }
      case 2: {
        // APPLICATION_COMMAND
        const { handleApplicationCommandRequest } =
          await import('./application');
        return handleApplicationCommandRequest({ body });
      }
      case 3: {
        // MESSAGE_COMPONENT
        const { handleButtonInteraction } = await import('./button');
        return handleButtonInteraction({ body });
      }
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
