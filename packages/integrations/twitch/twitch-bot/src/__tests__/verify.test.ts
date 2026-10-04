import crypto from 'crypto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { verifyTwitchRequest } from '../verify';
import { ApplicationError } from '@giveaway/util-errors';

const SECRET = 'eventsub-secret';
const NOW = new Date('2026-10-01T12:00:00.000Z');
const BODY = JSON.stringify({ challenge: 'abc', nested: { value: 1 } });

const sign = (
  messageId: string,
  timestamp: string,
  body: string,
  secret = SECRET
) =>
  'sha256=' +
  crypto
    .createHmac('sha256', secret)
    .update(messageId + timestamp + body)
    .digest('hex');

type RequestOptions = {
  messageId?: string | null;
  timestamp?: string | null;
  signature?: string | null;
  messageType?: string | null;
  body?: string;
};

const buildRequest = ({
  messageId = 'message-1',
  timestamp = NOW.toISOString(),
  messageType = 'notification',
  body = BODY,
  signature
}: RequestOptions = {}) => {
  const headers = new Headers();
  const resolvedSignature =
    signature === undefined
      ? sign(messageId ?? '', timestamp ?? '', body)
      : signature;
  if (messageId !== null) headers.set('Twitch-Eventsub-Message-Id', messageId);
  if (timestamp !== null) {
    headers.set('Twitch-Eventsub-Message-Timestamp', timestamp);
  }
  if (resolvedSignature !== null) {
    headers.set('Twitch-Eventsub-Message-Signature', resolvedSignature);
  }
  if (messageType !== null) {
    headers.set('Twitch-Eventsub-Message-Type', messageType);
  }
  return new NextRequest('http://localhost:3000/api/twitch/webhooks', {
    method: 'POST',
    headers,
    body
  });
};

const verifyError = async (request: NextRequest) =>
  verifyTwitchRequest(request).catch((e: unknown) => e);

describe('verifyTwitchRequest', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubEnv('TWITCH_EVENTSUB_SECRET', SECRET);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  describe('when the request is correctly signed and fresh', () => {
    it('returns the parsed JSON body', async () => {
      const result = await verifyTwitchRequest(buildRequest());

      expect(result.body).toEqual({ challenge: 'abc', nested: { value: 1 } });
    });

    it.each(['webhook_callback_verification', 'notification', 'revocation'])(
      'returns the %s message type',
      async (messageType) => {
        const result = await verifyTwitchRequest(buildRequest({ messageType }));

        expect(result.messageType).toBe(messageType);
      }
    );

    it('returns an unrecognised message type unchanged', async () => {
      const result = await verifyTwitchRequest(
        buildRequest({ messageType: 'something_new' })
      );

      expect(result.messageType).toBe('something_new');
    });
  });

  describe('when the eventsub secret is not configured', () => {
    it.each([
      ['unset', undefined],
      ['empty', '']
    ])('throws INTERNAL_SERVER_ERROR when %s', async (_, value) => {
      vi.stubEnv('TWITCH_EVENTSUB_SECRET', value);

      const error = await verifyError(buildRequest());

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Twitch EventSub secret is not configured'
      });
    });
  });

  describe('when a required header is missing', () => {
    it.each([
      ['messageId', 'Missing Twitch message ID header'],
      ['timestamp', 'Missing Twitch timestamp header'],
      ['signature', 'Missing Twitch signature header'],
      ['messageType', 'Missing Twitch message type header']
    ] as const)('throws UNAUTHORIZED without %s', async (header, message) => {
      const error = await verifyError(buildRequest({ [header]: null }));

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({ code: 'UNAUTHORIZED', message });
    });

    it.each([
      ['messageId', 'Missing Twitch message ID header'],
      ['timestamp', 'Missing Twitch timestamp header'],
      ['signature', 'Missing Twitch signature header'],
      ['messageType', 'Missing Twitch message type header']
    ] as const)(
      'treats an empty %s header as missing',
      async (header, message) => {
        const error = await verifyError(buildRequest({ [header]: '' }));

        expect(error).toMatchObject({ code: 'UNAUTHORIZED', message });
      }
    );

    it('reports the message id first when every header is missing', async () => {
      const error = await verifyError(
        buildRequest({
          messageId: null,
          timestamp: null,
          signature: null,
          messageType: null
        })
      );

      expect(error).toMatchObject({
        message: 'Missing Twitch message ID header'
      });
    });
  });

  describe('when the signature does not match', () => {
    it('rejects a signature made with a different secret', async () => {
      const error = await verifyError(
        buildRequest({
          signature: sign('message-1', NOW.toISOString(), BODY, 'other-secret')
        })
      );

      expect(error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Invalid Twitch signature'
      });
    });

    it('rejects a signature without the sha256 prefix', async () => {
      const error = await verifyError(
        buildRequest({
          signature: sign('message-1', NOW.toISOString(), BODY).replace(
            'sha256=',
            ''
          )
        })
      );

      expect(error).toMatchObject({ message: 'Invalid Twitch signature' });
    });

    it('rejects a body that was changed after signing', async () => {
      const error = await verifyError(
        buildRequest({
          signature: sign('message-1', NOW.toISOString(), BODY),
          body: JSON.stringify({ challenge: 'tampered' })
        })
      );

      expect(error).toMatchObject({ message: 'Invalid Twitch signature' });
    });

    it('rejects a message id that was changed after signing', async () => {
      const error = await verifyError(
        buildRequest({
          messageId: 'message-2',
          signature: sign('message-1', NOW.toISOString(), BODY)
        })
      );

      expect(error).toMatchObject({ message: 'Invalid Twitch signature' });
    });

    it('checks the signature before the timestamp', async () => {
      const error = await verifyError(
        buildRequest({
          timestamp: '2020-01-01T00:00:00.000Z',
          signature: 'sha256=bad'
        })
      );

      expect(error).toMatchObject({ message: 'Invalid Twitch signature' });
    });
  });

  describe('timestamp freshness', () => {
    const at = (offsetMs: number) =>
      new Date(NOW.getTime() + offsetMs).toISOString();

    it('accepts a message exactly ten minutes old', async () => {
      const result = await verifyTwitchRequest(
        buildRequest({ timestamp: at(-10 * 60 * 1000) })
      );

      expect(result.messageType).toBe('notification');
    });

    it('rejects a message older than ten minutes', async () => {
      const error = await verifyError(
        buildRequest({ timestamp: at(-10 * 60 * 1000 - 1) })
      );

      expect(error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Twitch message timestamp too old'
      });
    });

    it('rejects a message more than ten minutes in the future', async () => {
      const error = await verifyError(
        buildRequest({ timestamp: at(10 * 60 * 1000 + 1) })
      );

      expect(error).toMatchObject({
        message: 'Twitch message timestamp too old'
      });
    });

    it('accepts a correctly signed timestamp that is not a date', async () => {
      const result = await verifyTwitchRequest(
        buildRequest({ timestamp: 'not-a-date' })
      );

      expect(result.body).toEqual({ challenge: 'abc', nested: { value: 1 } });
    });
  });

  describe('when the signed body is not JSON', () => {
    it('throws a SyntaxError', async () => {
      const error = await verifyError(buildRequest({ body: 'not json' }));

      expect(error).toBeInstanceOf(SyntaxError);
    });
  });
});
