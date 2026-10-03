import { ApplicationError } from '@giveaway/util-errors';
import { NextRequest, NextResponse } from 'next/server';
import { verifyTwitchRequest } from './verify';

export const POST = async (request: NextRequest) => {
  try {
    const { body, messageType } = await verifyTwitchRequest(request);
    console.info(
      'Received Twitch webhook request with message type:',
      messageType
    );

    switch (messageType) {
      case 'webhook_callback_verification': {
        const { handleSubscriptionVerification } =
          await import('./verification');
        return handleSubscriptionVerification(body);
      }
      case 'notification': {
        const { handleNotification } = await import('./notification');
        return handleNotification(body);
      }
      case 'revocation': {
        const { handleRevocation } = await import('./revocation');
        return handleRevocation(body);
      }
      default:
        return NextResponse.json(
          { error: 'Unknown message type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Twitch webhook error:', error);

    if (error instanceof ApplicationError) {
      if (error.code === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
