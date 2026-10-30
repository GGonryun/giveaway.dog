import crypto from 'crypto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../handler';
import { prismaMock } from '@giveaway/testing-server/prisma';
import {
  chatMessageEvent,
  eventSubRecord,
  subscriptionPayload
} from '@giveaway/testing-server/fixtures-twitch';

const redisMock = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn()
}));

vi.mock('@giveaway/cache/redis', () => ({ redis: redisMock }));

const SECRET = 'eventsub-secret';
const NOW = new Date('2026-10-01T12:00:00.000Z');

type WebhookOptions = {
  messageType: string;
  body: unknown;
  signature?: string;
  includeSignature?: boolean;
};

const webhookRequest = ({
  messageType,
  body,
  signature,
  includeSignature = true
}: WebhookOptions) => {
  const raw = JSON.stringify(body);
  const messageId = 'message-1';
  const timestamp = NOW.toISOString();
  const headers = new Headers({
    'Twitch-Eventsub-Message-Id': messageId,
    'Twitch-Eventsub-Message-Timestamp': timestamp,
    'Twitch-Eventsub-Message-Type': messageType,
    'Content-Type': 'application/json'
  });
  if (includeSignature) {
    headers.set(
      'Twitch-Eventsub-Message-Signature',
      signature ??
        'sha256=' +
          crypto
            .createHmac('sha256', SECRET)
            .update(messageId + timestamp + raw)
            .digest('hex')
    );
  }
  return new NextRequest('http://localhost:3000/api/twitch/webhooks', {
    method: 'POST',
    headers,
    body: raw
  });
};

describe('twitch webhook POST handler', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubEnv('TWITCH_EVENTSUB_SECRET', SECRET);
    vi.stubEnv('TWITCH_BOT_USER_ID', 'bot-1');
    redisMock.get.mockReset();
    redisMock.set.mockReset();
    redisMock.set.mockResolvedValue('OK');
    redisMock.del.mockReset();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('webhook_callback_verification', () => {
    const request = () =>
      webhookRequest({
        messageType: 'webhook_callback_verification',
        body: {
          challenge: 'challenge-123',
          subscription: subscriptionPayload()
        }
      });

    it('responds 200 with the challenge as plain text', async () => {
      const response = await POST(request());

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/plain');
      await expect(response.text()).resolves.toBe('challenge-123');
    });

    it('responds 400 when the verification body has no challenge', async () => {
      const response = await POST(
        webhookRequest({
          messageType: 'webhook_callback_verification',
          body: { subscription: subscriptionPayload() }
        })
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Bad request' });
    });
  });

  describe('notification', () => {
    it('responds ok for an unhandled event type', async () => {
      const response = await POST(
        webhookRequest({
          messageType: 'notification',
          body: {
            subscription: subscriptionPayload({ type: 'channel.follow' }),
            event: {}
          }
        })
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ status: 'ok' });
    });

    it('routes chat messages to the chat processor', async () => {
      const response = await POST(
        webhookRequest({
          messageType: 'notification',
          body: {
            subscription: subscriptionPayload(),
            event: chatMessageEvent({ chatter_user_id: 'bot-1' })
          }
        })
      );

      expect(response.status).toBe(200);
      expect(console.info).toHaveBeenCalledWith(
        'Processing Twitch chat message event:',
        expect.objectContaining({
          chatter_user_id: 'bot-1',
          message_id: 'message-1'
        })
      );
      expect(redisMock.get).not.toHaveBeenCalled();
    });

    it('responds 400 when the chat event is invalid', async () => {
      const response = await POST(
        webhookRequest({
          messageType: 'notification',
          body: { subscription: subscriptionPayload(), event: { nope: true } }
        })
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Bad request' });
    });

    it('responds 400 when the notification has no subscription', async () => {
      const response = await POST(
        webhookRequest({ messageType: 'notification', body: { event: {} } })
      );

      expect(response.status).toBe(400);
    });
  });

  describe('revocation', () => {
    it('removes the stored subscription and responds ok', async () => {
      prismaMock.eventSubSubscription.findUnique.mockResolvedValue(
        eventSubRecord({ id: 'db-sub-1' })
      );
      prismaMock.eventSubSubscription.count.mockResolvedValue(1);

      const response = await POST(
        webhookRequest({
          messageType: 'revocation',
          body: { subscription: subscriptionPayload({ status: 'revoked' }) }
        })
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ status: 'ok' });
      expect(prismaMock.eventSubSubscription.delete).toHaveBeenCalledWith({
        where: { id: 'db-sub-1' }
      });
    });

    it('responds 500 when the database fails', async () => {
      prismaMock.eventSubSubscription.findUnique.mockRejectedValue(
        new Error('db down')
      );

      const response = await POST(
        webhookRequest({
          messageType: 'revocation',
          body: { subscription: subscriptionPayload() }
        })
      );

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: 'Internal server error'
      });
    });

    it('responds 400 when the revocation body is invalid', async () => {
      const response = await POST(
        webhookRequest({
          messageType: 'revocation',
          body: { subscription: {} }
        })
      );

      expect(response.status).toBe(400);
    });
  });

  describe('redelivered messages', () => {
    const notification = () =>
      webhookRequest({
        messageType: 'notification',
        body: {
          subscription: subscriptionPayload(),
          event: chatMessageEvent({ chatter_user_id: 'bot-1' })
        }
      });

    const revocation = () =>
      webhookRequest({
        messageType: 'revocation',
        body: { subscription: subscriptionPayload({ status: 'revoked' }) }
      });

    it('records the message ID for 10 minutes before processing it', async () => {
      await POST(notification());

      expect(redisMock.set).toHaveBeenCalledWith(
        'twitch:eventsub:message-1',
        1,
        { nx: true, ex: 600 }
      );
    });

    it('skips a notification that was already received', async () => {
      redisMock.set.mockResolvedValue(null);

      const response = await POST(notification());

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ status: 'ok' });
      expect(console.info).toHaveBeenCalledWith(
        'Skipping a Twitch message that was already received:',
        'message-1'
      );
      expect(console.info).not.toHaveBeenCalledWith(
        'Processing Twitch chat message event:',
        expect.anything()
      );
    });

    it('skips a revocation that was already received', async () => {
      redisMock.set.mockResolvedValue(null);

      const response = await POST(revocation());

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ status: 'ok' });
      expect(prismaMock.eventSubSubscription.findUnique).not.toHaveBeenCalled();
    });

    it('forgets the message ID when processing fails, so the next delivery runs', async () => {
      prismaMock.eventSubSubscription.findUnique.mockRejectedValue(
        new Error('db down')
      );

      const response = await POST(revocation());

      expect(response.status).toBe(500);
      expect(redisMock.del).toHaveBeenCalledWith('twitch:eventsub:message-1');
    });

    it('keeps the message ID when processing succeeds', async () => {
      await POST(notification());

      expect(redisMock.del).not.toHaveBeenCalled();
    });

    it('answers every subscription verification', async () => {
      redisMock.set.mockResolvedValue(null);

      const response = await POST(
        webhookRequest({
          messageType: 'webhook_callback_verification',
          body: {
            challenge: 'challenge-123',
            subscription: subscriptionPayload()
          }
        })
      );

      await expect(response.text()).resolves.toBe('challenge-123');
      expect(redisMock.set).not.toHaveBeenCalled();
    });
  });

  describe('unknown message types', () => {
    it('responds 400', async () => {
      const response = await POST(
        webhookRequest({ messageType: 'mystery', body: {} })
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: 'Unknown message type'
      });
    });

    it('logs the received message type', async () => {
      await POST(webhookRequest({ messageType: 'mystery', body: {} }));

      expect(console.info).toHaveBeenCalledWith(
        'Received Twitch webhook request with message type:',
        'mystery'
      );
    });
  });

  describe('verification failures', () => {
    it('responds 401 for an invalid signature', async () => {
      const response = await POST(
        webhookRequest({
          messageType: 'notification',
          body: {},
          signature: 'sha256=forged'
        })
      );

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    });

    it('responds 401 for a missing signature header', async () => {
      const response = await POST(
        webhookRequest({
          messageType: 'notification',
          body: {},
          includeSignature: false
        })
      );

      expect(response.status).toBe(401);
    });

    it('responds 400 for a correctly signed body that is not JSON', async () => {
      const raw = 'not json';
      const timestamp = NOW.toISOString();
      const response = await POST(
        new NextRequest('http://localhost:3000/api/twitch/webhooks', {
          method: 'POST',
          headers: {
            'Twitch-Eventsub-Message-Id': 'message-1',
            'Twitch-Eventsub-Message-Timestamp': timestamp,
            'Twitch-Eventsub-Message-Type': 'notification',
            'Twitch-Eventsub-Message-Signature':
              'sha256=' +
              crypto
                .createHmac('sha256', SECRET)
                .update('message-1' + timestamp + raw)
                .digest('hex')
          },
          body: raw
        })
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Bad request' });
    });

    it('responds 500 when the eventsub secret is not configured', async () => {
      vi.stubEnv('TWITCH_EVENTSUB_SECRET', undefined);

      const response = await POST(
        webhookRequest({ messageType: 'notification', body: {} })
      );

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: 'Internal server error'
      });
    });

    it('logs the error', async () => {
      await POST(
        webhookRequest({
          messageType: 'notification',
          body: {},
          signature: 'sha256=forged'
        })
      );

      expect(console.error).toHaveBeenCalledWith(
        'Twitch webhook error:',
        expect.objectContaining({
          code: 'UNAUTHORIZED',
          message: 'Invalid Twitch signature'
        })
      );
    });
  });
});
