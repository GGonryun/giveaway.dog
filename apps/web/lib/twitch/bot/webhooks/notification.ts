import { NextResponse } from 'next/server';
import { twitchEventSubNotificationSchema } from '@giveaway/twitch-model/schema';
import { processChatMessage } from './chat-message';

export const handleNotification = async (body: unknown) => {
  const data = twitchEventSubNotificationSchema.parse(body);
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
