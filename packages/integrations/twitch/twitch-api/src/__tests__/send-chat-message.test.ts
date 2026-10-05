import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendChatMessage } from '../send-chat-message';
import {
  CHAT_URL,
  TOKEN_URL,
  emptyResponse,
  jsonBody,
  jsonResponse,
  textResponse
} from '@giveaway/testing-server/fixtures-twitch';

vi.hoisted(() => {
  vi.stubEnv('TWITCH_CLIENT_ID', 'client-id');
  vi.stubEnv('TWITCH_CLIENT_SECRET', 'client-secret');
  vi.stubEnv('TWITCH_BOT_USER_ID', 'bot-1');
});

const redisMock = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn()
}));

vi.mock('@giveaway/cache/redis', () => ({ redis: redisMock }));

const fetchMock = vi.fn<typeof fetch>();

const routeFetch = ({
  chat,
  refresh = () =>
    jsonResponse({ access_token: 'refreshed-token', expires_in: 3600 })
}: {
  chat: (token: string) => Response;
  refresh?: () => Response;
}) => {
  fetchMock.mockImplementation(async (input, init) => {
    const url = String(input);
    if (url === TOKEN_URL) {
      return refresh();
    }
    if (url === CHAT_URL) {
      const headers = init?.headers as Record<string, string>;
      return chat(headers.Authorization.replace('Bearer ', ''));
    }
    throw new Error(`Unexpected fetch to ${url}`);
  });
};

const chatCalls = () =>
  fetchMock.mock.calls.filter(([url]) => url === CHAT_URL);

describe('sendChatMessage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    redisMock.get.mockReset().mockResolvedValue('cached-token');
    redisMock.set.mockReset().mockResolvedValue('OK');
    redisMock.del.mockReset().mockResolvedValue(1);
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('TWITCH_BOT_REFRESH_TOKEN', 'bot-refresh-token');
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('when no bot token is available', () => {
    beforeEach(() => {
      redisMock.get.mockResolvedValue(null);
      vi.stubEnv('TWITCH_BOT_REFRESH_TOKEN', undefined);
    });

    it('does not call twitch', async () => {
      await sendChatMessage('broadcaster-1', 'hello');

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('logs that the reply was skipped', async () => {
      await sendChatMessage('broadcaster-1', 'hello');

      expect(console.info).toHaveBeenCalledWith(
        '[Twitch] No bot token configured, skipping chat reply'
      );
    });
  });

  describe('when the cached bot token is accepted', () => {
    beforeEach(() => {
      routeFetch({ chat: () => emptyResponse(204) });
    });

    it('posts the message as the bot to the chat endpoint', async () => {
      await sendChatMessage('broadcaster-1', 'hello chat');

      const [[url, init]] = chatCalls();
      expect(url).toBe(CHAT_URL);
      expect(init?.method).toBe('POST');
      expect(init?.headers).toEqual({
        Authorization: 'Bearer cached-token',
        'Client-Id': 'client-id',
        'Content-Type': 'application/json'
      });
      expect(jsonBody(init)).toEqual({
        broadcaster_id: 'broadcaster-1',
        sender_id: 'bot-1',
        message: 'hello chat'
      });
    });

    it('sends the message only once', async () => {
      await sendChatMessage('broadcaster-1', 'hello chat');

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('does not log an error', async () => {
      await sendChatMessage('broadcaster-1', 'hello chat');

      expect(console.error).not.toHaveBeenCalled();
    });

    it('resolves to undefined', async () => {
      await expect(
        sendChatMessage('broadcaster-1', 'hello chat')
      ).resolves.toBeUndefined();
    });
  });

  describe('when no token is cached but a refresh token is configured', () => {
    it('sends the message with the refreshed token', async () => {
      redisMock.get.mockResolvedValue(null);
      routeFetch({ chat: () => emptyResponse(204) });

      await sendChatMessage('broadcaster-1', 'hello');

      const [[, init]] = chatCalls();
      expect(init?.headers).toMatchObject({
        Authorization: 'Bearer refreshed-token'
      });
    });
  });

  describe('when twitch rejects the cached token with a 401', () => {
    it('invalidates the cached token', async () => {
      routeFetch({
        chat: (token) =>
          token === 'cached-token'
            ? textResponse('expired', 401)
            : emptyResponse(204)
      });

      await sendChatMessage('broadcaster-1', 'hello');

      expect(redisMock.del).toHaveBeenCalledWith('twitch:bot:access_token');
    });

    it('retries the message with the refreshed token', async () => {
      routeFetch({
        chat: (token) =>
          token === 'cached-token'
            ? textResponse('expired', 401)
            : emptyResponse(204)
      });

      await sendChatMessage('broadcaster-1', 'hello');

      expect(
        chatCalls().map(
          ([, init]) => (init?.headers as Record<string, string>).Authorization
        )
      ).toEqual(['Bearer cached-token', 'Bearer refreshed-token']);
      expect(jsonBody(chatCalls()[1][1])).toEqual({
        broadcaster_id: 'broadcaster-1',
        sender_id: 'bot-1',
        message: 'hello'
      });
    });

    it('does not log an error when the retry succeeds', async () => {
      routeFetch({
        chat: (token) =>
          token === 'cached-token'
            ? textResponse('expired', 401)
            : emptyResponse(204)
      });

      await sendChatMessage('broadcaster-1', 'hello');

      expect(console.error).not.toHaveBeenCalled();
    });

    it('logs the retry failure when the refreshed token is also rejected', async () => {
      routeFetch({ chat: () => textResponse('still unauthorized', 401) });

      await sendChatMessage('broadcaster-1', 'hello');

      expect(chatCalls()).toHaveLength(2);
      expect(console.error).toHaveBeenCalledWith(
        '[Twitch] Failed to send chat message: 401',
        'still unauthorized'
      );
    });

    it('skips the retry when the token cannot be refreshed', async () => {
      routeFetch({
        chat: () => textResponse('expired', 401),
        refresh: () => textResponse('bad refresh', 400)
      });

      await sendChatMessage('broadcaster-1', 'hello');

      expect(chatCalls()).toHaveLength(1);
      expect(console.info).toHaveBeenCalledWith(
        '[Twitch] Bot token refresh failed, skipping chat reply'
      );
    });
  });

  describe('when the token refresh response has no access token', () => {
    it('skips the reply when no token was cached', async () => {
      redisMock.get.mockResolvedValue(null);
      routeFetch({
        chat: () => emptyResponse(204),
        refresh: () => jsonResponse({ expires_in: 3600 })
      });

      await sendChatMessage('broadcaster-1', 'hello');

      expect(chatCalls()).toHaveLength(0);
      expect(console.info).toHaveBeenCalledWith(
        '[Twitch] No bot token configured, skipping chat reply'
      );
    });

    it('skips the retry after a 401', async () => {
      routeFetch({
        chat: () => textResponse('expired', 401),
        refresh: () => jsonResponse({ expires_in: 3600 })
      });

      await sendChatMessage('broadcaster-1', 'hello');

      expect(chatCalls()).toHaveLength(1);
      expect(console.info).toHaveBeenCalledWith(
        '[Twitch] Bot token refresh failed, skipping chat reply'
      );
    });
  });

  describe('when twitch rejects the message for another reason', () => {
    beforeEach(() => {
      routeFetch({ chat: () => textResponse('bot is banned', 403) });
    });

    it('logs the status and body', async () => {
      await sendChatMessage('broadcaster-1', 'hello');

      expect(console.error).toHaveBeenCalledWith(
        '[Twitch] Failed to send chat message: 403',
        'bot is banned'
      );
    });

    it('does not retry or invalidate the token', async () => {
      await sendChatMessage('broadcaster-1', 'hello');

      expect(chatCalls()).toHaveLength(1);
      expect(redisMock.del).not.toHaveBeenCalled();
    });

    it('resolves without throwing', async () => {
      await expect(
        sendChatMessage('broadcaster-1', 'hello')
      ).resolves.toBeUndefined();
    });
  });
});
