import 'server-only';

import { NextResponse } from 'next/server';
import {
  TwitchSubscriptionVerification,
  twitchSubscriptionVerificationSchema
} from '@giveaway/twitch-model/schema';

export const handleSubscriptionVerification = (body: unknown) => {
  const data = twitchSubscriptionVerificationSchema.parse(
    body
  ) as TwitchSubscriptionVerification;

  console.info(
    'Handling Twitch subscription verification for challenge:',
    data.challenge
  );

  return new NextResponse(data.challenge, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
};
