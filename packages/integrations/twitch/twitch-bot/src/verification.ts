import 'server-only';

import { ApplicationError } from '@giveaway/util-errors';
import { NextResponse } from 'next/server';
import {
  TwitchSubscriptionVerification,
  twitchSubscriptionVerificationSchema
} from '@giveaway/twitch-model/schema';

export const handleSubscriptionVerification = (body: unknown) => {
  const parsed = twitchSubscriptionVerificationSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'Invalid Twitch subscription verification'
    });
  }

  const data: TwitchSubscriptionVerification = parsed.data;

  console.info(
    'Handling Twitch subscription verification for challenge:',
    data.challenge
  );

  return new NextResponse(data.challenge, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
};
