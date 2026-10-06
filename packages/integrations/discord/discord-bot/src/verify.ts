import 'server-only';

import nacl from 'tweetnacl';

import { ApplicationError } from '@giveaway/util-errors';

import { NextRequest } from 'next/server';
import {
  DiscordInteractionSchema,
  toDiscordInteraction
} from '@giveaway/discord-model/schema';

const SIGNATURE_PATTERN = /^[0-9a-f]{128}$/i;
const PUBLIC_KEY_PATTERN = /^[0-9a-f]{64}$/i;

export const verifyDiscordRequest = async (
  request: NextRequest
): Promise<DiscordInteractionSchema> => {
  // Your public key can be found on your application in the Developer Portal
  const PUBLIC_KEY = process.env.DISCORD_BOT_PUBLIC_KEY;

  if (!PUBLIC_KEY) {
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message: 'Discord public key is not configured'
    });
  }

  const signature = request.headers.get('X-Signature-Ed25519');
  const timestamp = request.headers.get('X-Signature-Timestamp');

  if (!signature) {
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message: 'Discord request is missing signature in header'
    });
  }

  if (!timestamp) {
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message: 'Discord request is missing timestamp in header'
    });
  }

  if (!PUBLIC_KEY_PATTERN.test(PUBLIC_KEY)) {
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message: 'Discord public key is malformed'
    });
  }

  if (!SIGNATURE_PATTERN.test(signature)) {
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message: 'invalid request signature'
    });
  }

  const body = await request.text(); // rawBody is expected to be a string, not raw bytes

  const isVerified = nacl.sign.detached.verify(
    Buffer.from(timestamp + body),
    Buffer.from(signature, 'hex'),
    Buffer.from(PUBLIC_KEY, 'hex')
  );

  if (!isVerified) {
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message: 'invalid request signature'
    });
  }

  return toDiscordInteraction(parseJsonBody(body));
};

const parseJsonBody = (body: string): unknown => {
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Discord request body is not valid JSON',
      cause: error
    });
  }
};
