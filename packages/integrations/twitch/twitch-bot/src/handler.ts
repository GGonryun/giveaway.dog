import 'server-only';

import { ApplicationError } from '@giveaway/util-errors';
import { NextRequest, NextResponse } from 'next/server';
import { claimDelivery, releaseDelivery } from './deliveries';
import { verifyTwitchRequest } from './verify';

const processOnce = async (
  messageId: string,
  process: () => Promise<NextResponse>
) => {
  if (!(await claimDelivery(messageId))) {
    console.info(
      'Skipping a Twitch message that was already received:',
      messageId
    );
    return NextResponse.json({ status: 'ok' });
  }

  try {
    return await process();
  } catch (error) {
    await releaseDelivery(messageId);
    throw error;
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const { body, messageId, messageType } = await verifyTwitchRequest(request);
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
        return await processOnce(messageId, () => handleNotification(body));
      }
      case 'revocation': {
        const { handleRevocation } = await import('./revocation');
        return await processOnce(messageId, () => handleRevocation(body));
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
      if (error.code === 'BAD_REQUEST') {
        return NextResponse.json({ error: 'Bad request' }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
