import crypto from 'crypto';
import fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { assertAsyncProperty } from '@giveaway/testing-server/property';
import { POST } from '../handler';

vi.mock('@giveaway/cache/redis', () => ({
  redis: { get: vi.fn(), set: vi.fn(), del: vi.fn() }
}));

const SECRET = 'eventsub-secret';
const NOW = new Date('2026-10-01T12:00:00.000Z');

const headerChar = fc.mapToConstant(
  { num: 95, build: (v) => String.fromCharCode(0x20 + v) },
  { num: 1, build: () => '\t' }
);

const headerValue = fc
  .string({ unit: headerChar, minLength: 1, maxLength: 60 })
  .filter((value) => value.trim() === value && value.length > 0);

const headerName = fc.oneof(
  fc.constantFrom(
    'Twitch-Eventsub-Message-Id',
    'Twitch-Eventsub-Message-Timestamp',
    'Twitch-Eventsub-Message-Signature',
    'Twitch-Eventsub-Message-Type',
    'Content-Type'
  ),
  fc.stringMatching(/^[A-Za-z][A-Za-z0-9-]{0,30}$/)
);

const messageType = fc.oneof(
  fc.constantFrom(
    'webhook_callback_verification',
    'notification',
    'revocation'
  ),
  headerValue
);

const body = fc.oneof(
  fc.jsonValue().map((value) => JSON.stringify(value)),
  fc.string({ unit: 'binary', maxLength: 200 })
);

const sign = (messageId: string, timestamp: string, raw: string) =>
  'sha256=' +
  crypto
    .createHmac('sha256', SECRET)
    .update(messageId + timestamp + raw)
    .digest('hex');

const webhookRequest = (headers: [string, string][], raw: string) =>
  new NextRequest('http://localhost:3000/api/twitch/webhooks', {
    method: 'POST',
    headers: new Headers(headers),
    body: raw
  });

describe('twitch webhook POST handler properties', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubEnv('TWITCH_EVENTSUB_SECRET', SECRET);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('[TWITCH-101] responds 401 to arbitrary headers and bodies without a valid signature', async () => {
    await assertAsyncProperty(
      fc.asyncProperty(
        fc.array(fc.tuple(headerName, headerValue), { maxLength: 8 }),
        body,
        async (headers, raw) => {
          const response = await POST(webhookRequest(headers, raw));

          expect(response.status).toBe(401);
        }
      )
    );
  });

  it('[TWITCH-102] responds 401 to a mutated body or signature, never 5xx', async () => {
    await assertAsyncProperty(
      fc.asyncProperty(
        headerValue,
        messageType,
        body,
        body,
        fc.boolean(),
        async (messageId, type, signedBody, sentBody, mutateSignature) => {
          const timestamp = NOW.toISOString();
          const signature = sign(messageId, timestamp, signedBody);
          fc.pre(
            mutateSignature ||
              !Buffer.from(signedBody).equals(Buffer.from(sentBody))
          );

          const response = await POST(
            webhookRequest(
              [
                ['Twitch-Eventsub-Message-Id', messageId],
                ['Twitch-Eventsub-Message-Timestamp', timestamp],
                ['Twitch-Eventsub-Message-Type', type],
                [
                  'Twitch-Eventsub-Message-Signature',
                  mutateSignature ? `${signature.slice(0, -1)}x` : signature
                ]
              ],
              mutateSignature ? signedBody : sentBody
            )
          );

          expect(response.status).toBe(401);
        }
      )
    );
  });

  it('[TWITCH-103] responds 400 to a correctly signed body that is not JSON', async () => {
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
      fc.asyncProperty(
        headerValue,
        messageType,
        notJson,
        async (messageId, type, raw) => {
          const timestamp = NOW.toISOString();

          const response = await POST(
            webhookRequest(
              [
                ['Twitch-Eventsub-Message-Id', messageId],
                ['Twitch-Eventsub-Message-Timestamp', timestamp],
                ['Twitch-Eventsub-Message-Type', type],
                [
                  'Twitch-Eventsub-Message-Signature',
                  sign(messageId, timestamp, raw)
                ]
              ],
              raw
            )
          );

          expect(response.status).toBe(400);
        }
      )
    );
  });
});
