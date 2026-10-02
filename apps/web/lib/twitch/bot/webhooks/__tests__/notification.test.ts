import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZodError } from 'zod';
import { handleNotification } from '../notification';
import { processChatMessage } from '../chat-message';
import {
  chatMessageEvent,
  subscriptionPayload
} from '@/lib/twitch/__tests__/fixtures-twitch';

vi.mock('../chat-message', () => ({ processChatMessage: vi.fn() }));

const processChatMessageMock = vi.mocked(processChatMessage);

describe('handleNotification', () => {
  beforeEach(() => {
    processChatMessageMock.mockReset().mockResolvedValue(undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when the notification is a chat message', () => {
    const event = chatMessageEvent();
    const body = { subscription: subscriptionPayload(), event };

    it('processes the chat message event', async () => {
      await handleNotification(body);

      expect(processChatMessageMock).toHaveBeenCalledWith(event);
    });

    it('responds with ok', async () => {
      const response = await handleNotification(body);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ status: 'ok' });
    });

    it('passes an undefined event through when the payload has none', async () => {
      await handleNotification({ subscription: subscriptionPayload() });

      expect(processChatMessageMock).toHaveBeenCalledWith(undefined);
    });

    it('propagates a chat message processing failure', async () => {
      processChatMessageMock.mockRejectedValue(new Error('processing failed'));

      await expect(handleNotification(body)).rejects.toThrow(
        'processing failed'
      );
    });
  });

  describe('when the notification type is not handled', () => {
    const body = {
      subscription: subscriptionPayload({ type: 'channel.follow' }),
      event: { user_id: 'u-1' }
    };

    it('does not process a chat message', async () => {
      await handleNotification(body);

      expect(processChatMessageMock).not.toHaveBeenCalled();
    });

    it('logs the unhandled type', async () => {
      await handleNotification(body);

      expect(console.log).toHaveBeenCalledWith(
        '[Twitch] Unhandled event type: channel.follow'
      );
    });

    it('responds with ok', async () => {
      const response = await handleNotification(body);

      await expect(response.json()).resolves.toEqual({ status: 'ok' });
    });
  });

  describe('when the body is invalid', () => {
    it('throws a ZodError without processing', async () => {
      await expect(handleNotification({ event: {} })).rejects.toThrow(ZodError);
      expect(processChatMessageMock).not.toHaveBeenCalled();
    });
  });
});
