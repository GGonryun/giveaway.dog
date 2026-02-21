import crypto from 'crypto';

import { ApplicationError } from '@/lib/errors';
import { NextRequest } from 'next/server';

const TWITCH_MESSAGE_ID = 'twitch-eventsub-message-id';
const TWITCH_MESSAGE_TIMESTAMP = 'twitch-eventsub-message-timestamp';
const TWITCH_MESSAGE_SIGNATURE = 'twitch-eventsub-message-signature';
const TWITCH_MESSAGE_TYPE = 'twitch-eventsub-message-type';
const HMAC_PREFIX = 'sha256=';

export type TwitchMessageType =
  | 'webhook_callback_verification'
  | 'notification'
  | 'revocation';

export interface VerifiedTwitchRequest {
  body: unknown;
  messageType: TwitchMessageType;
}

export const verifyTwitchRequest = async (
  request: NextRequest
): Promise<VerifiedTwitchRequest> => {
  const secret = process.env.TWITCH_EVENTSUB_SECRET;

  if (!secret) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Twitch EventSub secret is not configured'
    });
  }

  const messageId = request.headers.get(TWITCH_MESSAGE_ID);
  const timestamp = request.headers.get(TWITCH_MESSAGE_TIMESTAMP);
  const signature = request.headers.get(TWITCH_MESSAGE_SIGNATURE);
  const messageType = request.headers.get(TWITCH_MESSAGE_TYPE);

  if (!messageId) {
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message: 'Missing Twitch message ID header'
    });
  }

  if (!timestamp) {
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message: 'Missing Twitch timestamp header'
    });
  }

  if (!signature) {
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message: 'Missing Twitch signature header'
    });
  }

  if (!messageType) {
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message: 'Missing Twitch message type header'
    });
  }

  const body = await request.text();
  const message = messageId + timestamp + body;

  const expectedSignature =
    HMAC_PREFIX +
    crypto.createHmac('sha256', secret).update(message).digest('hex');

  if (signature !== expectedSignature) {
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message: 'Invalid Twitch signature'
    });
  }

  const messageTime = new Date(timestamp).getTime();
  const currentTime = Date.now();
  const TEN_MINUTES_MS = 10 * 60 * 1000;

  if (Math.abs(currentTime - messageTime) > TEN_MINUTES_MS) {
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message: 'Twitch message timestamp too old'
    });
  }

  return {
    body: JSON.parse(body),
    messageType: messageType as TwitchMessageType
  };
};
