import 'server-only';

import crypto from 'crypto';

import { ApplicationError } from '@giveaway/util-errors';
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

  const expectedSignature = Buffer.from(
    HMAC_PREFIX +
      crypto.createHmac('sha256', secret).update(message).digest('hex')
  );
  const actualSignature = Buffer.from(signature);

  if (
    actualSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(actualSignature, expectedSignature)
  ) {
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message: 'Invalid Twitch signature'
    });
  }

  const messageTime = new Date(timestamp).getTime();
  const currentTime = Date.now();
  const TEN_MINUTES_MS = 10 * 60 * 1000;

  if (Number.isNaN(messageTime)) {
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message: 'Invalid Twitch timestamp'
    });
  }

  if (Math.abs(currentTime - messageTime) > TEN_MINUTES_MS) {
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message: 'Twitch message timestamp too old'
    });
  }

  return {
    body: parseJsonBody(body),
    messageType: messageType as TwitchMessageType
  };
};

const parseJsonBody = (body: string): unknown => {
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'Twitch message body is not valid JSON',
      cause: error
    });
  }
};
