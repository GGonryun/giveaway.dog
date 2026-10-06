import crypto from 'crypto';
import fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { ApplicationError } from '@giveaway/util-errors';
import { assertAsyncProperty } from '@giveaway/testing-server/property';
import { verifyTwitchRequest } from '../verify';

const SECRET = 'eventsub-secret';
const NOW = new Date('2026-10-01T12:00:00.000Z');
const TEN_MINUTES_MS = 10 * 60 * 1000;

const HEADER_NAMES = {
  messageId: 'Twitch-Eventsub-Message-Id',
  timestamp: 'Twitch-Eventsub-Message-Timestamp',
  signature: 'Twitch-Eventsub-Message-Signature',
  messageType: 'Twitch-Eventsub-Message-Type'
} as const;

type HeaderKey = keyof typeof HEADER_NAMES;

type TwitchHeaders = Partial<Record<HeaderKey, string>>;

const headerChar = fc.mapToConstant(
  { num: 95, build: (v) => String.fromCharCode(0x20 + v) },
  { num: 1, build: () => '\t' }
);

const headerValue = fc
  .string({ unit: headerChar, minLength: 1, maxLength: 60 })
  .filter((value) => value.trim() === value && value.length > 0);

const body = fc.oneof(
  fc.jsonValue().map((value) => JSON.stringify(value)),
  fc.string({ unit: 'binary', maxLength: 200 })
);

const jsonBody = fc.jsonValue().map((value) => JSON.stringify(value));

const freshTimestamp = fc
  .integer({ min: -TEN_MINUTES_MS, max: TEN_MINUTES_MS })
  .map((offset) => new Date(NOW.getTime() + offset).toISOString());

const messageType = fc.oneof(
  fc.constantFrom(
    'webhook_callback_verification',
    'notification',
    'revocation'
  ),
  headerValue
);

const sign = (messageId: string, timestamp: string, raw: string) =>
  'sha256=' +
  crypto
    .createHmac('sha256', SECRET)
    .update(messageId + timestamp + raw)
    .digest('hex');

const request = (headers: TwitchHeaders, raw: string) => {
  const init = new Headers();
  for (const key of Object.keys(HEADER_NAMES) as HeaderKey[]) {
    const value = headers[key];
    if (value !== undefined) init.set(HEADER_NAMES[key], value);
  }
  return new NextRequest('http://localhost:3000/api/twitch/webhooks', {
    method: 'POST',
    headers: init,
    body: raw
  });
};

const signedMessage = fc.record({
  messageId: headerValue,
  timestamp: freshTimestamp,
  messageType,
  body: jsonBody
});

const rejection = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected verifyTwitchRequest to reject');
};

const sameBytes = (a: string, b: string) =>
  Buffer.from(a).equals(Buffer.from(b));

describe('verifyTwitchRequest properties', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubEnv('TWITCH_EVENTSUB_SECRET', SECRET);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('[TWITCH-001] accepts a fresh, correctly signed JSON message and returns its body', async () => {
    await assertAsyncProperty(
      fc.asyncProperty(signedMessage, async (message) => {
        const result = await verifyTwitchRequest(
          request(
            {
              ...message,
              signature: sign(
                message.messageId,
                message.timestamp,
                message.body
              )
            },
            message.body
          )
        );

        expect(result).toEqual({
          body: JSON.parse(message.body),
          messageType: message.messageType
        });
      })
    );
  });

  it('[TWITCH-002] rejects any body other than the signed one', async () => {
    await assertAsyncProperty(
      fc.asyncProperty(signedMessage, body, async (message, mutatedBody) => {
        fc.pre(!sameBytes(mutatedBody, message.body));

        const error = await rejection(
          verifyTwitchRequest(
            request(
              {
                ...message,
                signature: sign(
                  message.messageId,
                  message.timestamp,
                  message.body
                )
              },
              mutatedBody
            )
          )
        );

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toMatchObject({
          code: 'UNAUTHORIZED',
          message: 'Invalid Twitch signature'
        });
      })
    );
  });

  it('[TWITCH-003] rejects any signature other than the expected one', async () => {
    const mutatedSignature = (signature: string) =>
      fc.oneof(
        headerValue,
        fc
          .tuple(
            fc.nat({ max: signature.length - 1 }),
            fc.constantFrom(...'0123456789abcdefABCDEF=')
          )
          .map(
            ([index, char]) =>
              signature.slice(0, index) + char + signature.slice(index + 1)
          ),
        fc.constant(signature.toUpperCase()),
        fc.constant(signature.slice(0, -1)),
        fc.constant(`${signature}0`)
      );

    await assertAsyncProperty(
      fc.asyncProperty(
        signedMessage.chain((message) => {
          const expected = sign(
            message.messageId,
            message.timestamp,
            message.body
          );
          return fc.tuple(
            fc.constant(message),
            fc.constant(expected),
            mutatedSignature(expected)
          );
        }),
        async ([message, expected, signature]) => {
          fc.pre(signature !== expected);

          const error = await rejection(
            verifyTwitchRequest(
              request({ ...message, signature }, message.body)
            )
          );

          expect(error).toBeInstanceOf(ApplicationError);
          expect(error).toMatchObject({
            code: 'UNAUTHORIZED',
            message: 'Invalid Twitch signature'
          });
        }
      )
    );
  });

  it('[TWITCH-004] rejects a correctly signed message when any required header is missing', async () => {
    const headerKeys = Object.keys(HEADER_NAMES) as HeaderKey[];

    await assertAsyncProperty(
      fc.asyncProperty(
        signedMessage,
        fc.subarray(headerKeys, { minLength: 1 }),
        async (message, missing) => {
          const headers: TwitchHeaders = {
            ...message,
            signature: sign(message.messageId, message.timestamp, message.body)
          };
          for (const key of missing) delete headers[key];

          const error = await rejection(
            verifyTwitchRequest(request(headers, message.body))
          );

          expect(error).toBeInstanceOf(ApplicationError);
          expect(error).toMatchObject({ code: 'UNAUTHORIZED' });
        }
      )
    );
  });

  it('[TWITCH-005] rejects arbitrary unsigned requests with UNAUTHORIZED, never another error', async () => {
    await assertAsyncProperty(
      fc.asyncProperty(
        fc.record(
          {
            messageId: headerValue,
            timestamp: fc.oneof(freshTimestamp, headerValue),
            signature: fc.oneof(
              headerValue,
              fc
                .stringMatching(/^[0-9a-f]{64}$/)
                .map((digest) => `sha256=${digest}`)
            ),
            messageType
          },
          { requiredKeys: [] }
        ),
        body,
        async (headers, raw) => {
          const error = await rejection(
            verifyTwitchRequest(request(headers, raw))
          );

          expect(error).toBeInstanceOf(ApplicationError);
          expect(error).toMatchObject({ code: 'UNAUTHORIZED' });
        }
      )
    );
  });

  it('[TWITCH-006] rejects a correctly signed message whose timestamp is not fresh', async () => {
    const staleTimestamp = fc.oneof(
      fc
        .integer({ min: TEN_MINUTES_MS + 1, max: 10 * 365 * 24 * 3600 * 1000 })
        .chain((offset) =>
          fc
            .constantFrom(-offset, offset)
            .map((signed) => new Date(NOW.getTime() + signed).toISOString())
        ),
      headerValue.filter((value) => {
        const time = new Date(value).getTime();
        return (
          Number.isNaN(time) || Math.abs(time - NOW.getTime()) > TEN_MINUTES_MS
        );
      })
    );

    await assertAsyncProperty(
      fc.asyncProperty(
        signedMessage,
        staleTimestamp,
        async (message, timestamp) => {
          const error = await rejection(
            verifyTwitchRequest(
              request(
                {
                  ...message,
                  timestamp,
                  signature: sign(message.messageId, timestamp, message.body)
                },
                message.body
              )
            )
          );

          expect(error).toBeInstanceOf(ApplicationError);
          expect(error).toMatchObject({ code: 'UNAUTHORIZED' });
        }
      )
    );
  });

  it('[TWITCH-007] rejects a correctly signed body that is not JSON with BAD_REQUEST', async () => {
    const notJson = fc
      .string({ unit: 'binary', maxLength: 200 })
      .filter((raw) => {
        try {
          JSON.parse(raw);
          return false;
        } catch {
          return true;
        }
      });

    await assertAsyncProperty(
      fc.asyncProperty(signedMessage, notJson, async (message, raw) => {
        const error = await rejection(
          verifyTwitchRequest(
            request(
              {
                ...message,
                signature: sign(message.messageId, message.timestamp, raw)
              },
              raw
            )
          )
        );

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toMatchObject({ code: 'BAD_REQUEST' });
      })
    );
  });
});
