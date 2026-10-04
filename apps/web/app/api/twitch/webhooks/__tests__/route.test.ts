import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { ZodError } from 'zod';
import { POST } from '../route';
import { POST as handlerPOST } from '@/lib/twitch/bot/webhooks/handler';
import { prismaMock } from '@giveaway/testing-server/prisma';

const m = vi.hoisted(() => ({
  redisGet: vi.fn(),
  redisSet: vi.fn(),
  newVersionedRateLimiter: vi.fn()
}));

vi.mock('@giveaway/cache/redis', () => ({
  redis: { get: m.redisGet, set: m.redisSet }
}));

vi.mock('@giveaway/ratelimit/ratelimit', () => ({
  newVersionedRateLimiter: m.newVersionedRateLimiter
}));

const SECRET = 'eventsub-secret';
const NOW = new Date('2026-06-01T12:00:00.000Z');

const subscription = (type: string) => ({
  id: 'sub-1',
  type,
  version: '1',
  status: 'enabled',
  condition: { broadcaster_user_id: 'broadcaster-1' },
  transport: { method: 'webhook', callback: 'https://example.com/hook' },
  created_at: '2026-01-01T00:00:00.000Z'
});

const signature = (messageId: string, timestamp: string, body: string) =>
  'sha256=' +
  crypto
    .createHmac('sha256', SECRET)
    .update(messageId + timestamp + body)
    .digest('hex');

const twitchRequest = ({
  payload,
  messageType,
  timestamp = NOW.toISOString(),
  messageId = 'message-1',
  headers = {}
}: {
  payload: unknown;
  messageType: string;
  timestamp?: string;
  messageId?: string;
  headers?: Record<string, string | null>;
}) => {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const allHeaders: Record<string, string | null> = {
    'twitch-eventsub-message-id': messageId,
    'twitch-eventsub-message-timestamp': timestamp,
    'twitch-eventsub-message-signature': signature(messageId, timestamp, body),
    'twitch-eventsub-message-type': messageType,
    ...headers
  };
  const presentHeaders = Object.fromEntries(
    Object.entries(allHeaders).filter(
      (entry): entry is [string, string] => entry[1] !== null
    )
  );
  return new NextRequest('http://localhost:3000/api/twitch/webhooks', {
    method: 'POST',
    headers: presentHeaders,
    body
  });
};

const verificationRequest = () =>
  twitchRequest({
    payload: {
      challenge: 'challenge-abc',
      subscription: subscription('channel.chat.message')
    },
    messageType: 'webhook_callback_verification'
  });

describe('POST /api/twitch/webhooks', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubEnv('TWITCH_EVENTSUB_SECRET', SECRET);
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    m.redisGet.mockReset();
    m.redisSet.mockReset();
    m.newVersionedRateLimiter.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('is served by the Twitch webhook handler', () => {
    expect(POST).toBe(handlerPOST);
  });

  describe('when the request cannot be verified', () => {
    it('returns 500 when the EventSub secret is not configured', async () => {
      vi.stubEnv('TWITCH_EVENTSUB_SECRET', '');

      const res = await POST(verificationRequest());

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Internal server error' });
    });

    it.each([
      'twitch-eventsub-message-id',
      'twitch-eventsub-message-timestamp',
      'twitch-eventsub-message-signature',
      'twitch-eventsub-message-type'
    ])('returns 401 when the %s header is missing', async (header) => {
      const res = await POST(
        twitchRequest({
          payload: {},
          messageType: 'notification',
          headers: { [header]: null }
        })
      );

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 when the signature does not match', async () => {
      const res = await POST(
        twitchRequest({
          payload: {},
          messageType: 'notification',
          headers: { 'twitch-eventsub-message-signature': 'sha256=deadbeef' }
        })
      );

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 when the message is more than ten minutes old', async () => {
      const res = await POST(
        twitchRequest({
          payload: {},
          messageType: 'notification',
          timestamp: new Date(NOW.getTime() - 10 * 60 * 1000 - 1).toISOString()
        })
      );

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 when the message is more than ten minutes in the future', async () => {
      const res = await POST(
        twitchRequest({
          payload: {},
          messageType: 'notification',
          timestamp: new Date(NOW.getTime() + 10 * 60 * 1000 + 1).toISOString()
        })
      );

      expect(res.status).toBe(401);
    });

    it('accepts a message exactly ten minutes old', async () => {
      const res = await POST(
        twitchRequest({
          payload: { subscription: subscription('channel.follow') },
          messageType: 'notification',
          timestamp: new Date(NOW.getTime() - 10 * 60 * 1000).toISOString()
        })
      );

      expect(res.status).toBe(200);
    });

    it('returns 500 when the signed body is not JSON', async () => {
      const res = await POST(
        twitchRequest({ payload: 'not-json', messageType: 'notification' })
      );

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Internal server error' });
    });
  });

  describe('when the message type is unknown', () => {
    it('returns 400', async () => {
      const res = await POST(
        twitchRequest({ payload: {}, messageType: 'something_else' })
      );

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'Unknown message type' });
    });
  });

  describe('when a subscription verification is received', () => {
    it('echoes the challenge as plain text', async () => {
      const res = await POST(verificationRequest());

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('text/plain');
      expect(await res.text()).toBe('challenge-abc');
    });

    it('returns 500 when the verification payload is invalid', async () => {
      const res = await POST(
        twitchRequest({
          payload: { challenge: 'challenge-abc' },
          messageType: 'webhook_callback_verification'
        })
      );

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Internal server error' });
    });
  });

  describe('when a notification is received', () => {
    it('acknowledges event types it does not handle', async () => {
      const res = await POST(
        twitchRequest({
          payload: {
            subscription: subscription('channel.follow'),
            event: {}
          },
          messageType: 'notification'
        })
      );

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ status: 'ok' });
    });

    it('acknowledges chat messages that contain no command', async () => {
      const res = await POST(
        twitchRequest({
          payload: {
            subscription: subscription('channel.chat.message'),
            event: {
              broadcaster_user_id: 'broadcaster-1',
              broadcaster_user_login: 'streamer',
              broadcaster_user_name: 'Streamer',
              chatter_user_id: 'chatter-1',
              chatter_user_login: 'viewer',
              chatter_user_name: 'Viewer',
              message_id: 'chat-1',
              message: { text: 'hello chat' }
            }
          },
          messageType: 'notification'
        })
      );

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ status: 'ok' });
      expect(m.redisGet).not.toHaveBeenCalled();
    });

    it('rejects instead of returning 500 when the notification payload is invalid', async () => {
      await expect(
        POST(twitchRequest({ payload: {}, messageType: 'notification' }))
      ).rejects.toBeInstanceOf(ZodError);
    });
  });

  describe('when a revocation is received', () => {
    const revocationRequest = () =>
      twitchRequest({
        payload: { subscription: subscription('channel.chat.message') },
        messageType: 'revocation'
      });

    it('acknowledges a revocation for an unknown subscription without writes', async () => {
      prismaMock.eventSubSubscription.findUnique.mockResolvedValue(null);

      const res = await POST(revocationRequest());

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ status: 'ok' });
      expect(prismaMock.eventSubSubscription.findUnique).toHaveBeenCalledWith({
        where: { twitch_id: 'sub-1' },
        include: { integration: true }
      });
      expect(prismaMock.eventSubSubscription.delete).not.toHaveBeenCalled();
    });

    it('deletes the subscription and flags the integration when none remain', async () => {
      prismaMock.eventSubSubscription.findUnique.mockResolvedValue({
        id: 'local-sub-1',
        integrationId: 'integration-1'
      });
      prismaMock.eventSubSubscription.count.mockResolvedValue(0);

      const res = await POST(revocationRequest());

      expect(res.status).toBe(200);
      expect(prismaMock.eventSubSubscription.delete).toHaveBeenCalledWith({
        where: { id: 'local-sub-1' }
      });
      expect(prismaMock.eventSubSubscription.count).toHaveBeenCalledWith({
        where: { integrationId: 'integration-1' }
      });
      expect(prismaMock.integration.update).toHaveBeenCalledWith({
        where: { id: 'integration-1' },
        data: { status: 'ERROR' }
      });
    });

    it.each([1, 2])(
      'keeps the integration status when %i other subscriptions remain',
      async (remaining) => {
        prismaMock.eventSubSubscription.findUnique.mockResolvedValue({
          id: 'local-sub-1',
          integrationId: 'integration-1'
        });
        prismaMock.eventSubSubscription.count.mockResolvedValue(remaining);

        const res = await POST(revocationRequest());

        expect(res.status).toBe(200);
        expect(prismaMock.eventSubSubscription.delete).toHaveBeenCalledWith({
          where: { id: 'local-sub-1' }
        });
        expect(prismaMock.integration.update).not.toHaveBeenCalled();
      }
    );

    it('rejects instead of returning 500 when the database fails', async () => {
      prismaMock.eventSubSubscription.findUnique.mockRejectedValue(
        new Error('db down')
      );

      await expect(POST(revocationRequest())).rejects.toThrow('db down');
    });
  });
});
