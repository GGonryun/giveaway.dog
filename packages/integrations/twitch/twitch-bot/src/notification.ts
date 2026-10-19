import 'server-only';

import { ApplicationError } from '@giveaway/util-errors';
import { NextResponse } from 'next/server';
import { twitchEventSubNotificationSchema } from '@giveaway/twitch-model/schema';
import { processChatMessage } from './chat-message';

export const handleNotification = async (body: unknown) => {
  const parsed = twitchEventSubNotificationSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'Invalid Twitch notification'
    });
  }

  const data = parsed.data;
  const { subscription, event } = data;

  switch (subscription.type) {
    case 'channel.chat.message':
      await processChatMessage(event);
      break;
    default:
      console.log(`[Twitch] Unhandled event type: ${subscription.type}`);
  }

  return NextResponse.json({ status: 'ok' });
};
