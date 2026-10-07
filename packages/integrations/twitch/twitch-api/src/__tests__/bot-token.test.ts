import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBotAccessToken, invalidateAndRefreshBotToken } from '../bot-token';
import {
  TOKEN_URL,
  formBody,
  jsonResponse,
  textResponse
} from '@giveaway/testing-server/fixtures-twitch';

vi.hoisted(() => {
  vi.stubEnv('TWITCH_CLIENT_ID', 'client-id');
  vi.stubEnv('TWITCH_CLIENT_SECRET', 'client-secret');
});

const redisMock = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn()
}));

vi.mock('@giveaway/cache/redis', () => ({ redis: redisMock }));

const CACHE_KEY = 'twitch:bot:access_token';

const fetchMock = vi.fn<typeof fetch>();

describe('bot-token', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    redisMock.get.mockReset().mockResolvedValue(null);
    redisMock.set.mockReset().mockResolvedValue('OK');
    redisMock.del.mockReset().mockResolvedValue(1);
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('TWITCH_BOT_REFRESH_TOKEN', 'bot-refresh-token');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('getBotAccessToken', () => {
    describe('when a token is cached', () => {
      beforeEach(() => {
        redisMock.get.mockResolvedValue('cached-token');
      });

      it('reads the bot token cache key', async () => {
        await getBotAccessToken();

        expect(redisMock.get).toHaveBeenCalledWith(CACHE_KEY);
      });

      it('returns the cached token without calling twitch', async () => {
        await expect(getBotAccessToken()).resolves.toBe('cached-token');
        expect(fetchMock).not.toHaveBeenCalled();
      });
    });

    describe('when the cached token is an empty string', () => {
      it('treats it as missing and refreshes', async () => {
        redisMock.get.mockResolvedValue('');
        fetchMock.mockResolvedValue(
          jsonResponse({ access_token: 'fresh-token', expires_in: 3600 })
        );

        await expect(getBotAccessToken()).resolves.toBe('fresh-token');
      });
    });

    describe('when no token is cached', () => {
      describe('and twitch refreshes the token', () => {
        beforeEach(() => {
          fetchMock.mockResolvedValue(
            jsonResponse({ access_token: 'fresh-token', expires_in: 3600 })
          );
        });

        it('posts a refresh_token grant to the token endpoint', async () => {
          await getBotAccessToken();

          const [url, init] = fetchMock.mock.calls[0];
          expect(url).toBe(TOKEN_URL);
          expect(init?.method).toBe('POST');
          expect(init?.headers).toEqual({
            'Content-Type': 'application/x-www-form-urlencoded'
          });
          expect(formBody(init)).toEqual({
            client_id: 'client-id',
            client_secret: 'client-secret',
            grant_type: 'refresh_token',
            refresh_token: 'bot-refresh-token'
          });
        });

        it('caches the new token for one minute less than it lives', async () => {
          await getBotAccessToken();

          expect(redisMock.set).toHaveBeenCalledWith(CACHE_KEY, 'fresh-token', {
            ex: 3540
          });
        });

        it('returns the new token', async () => {
          await expect(getBotAccessToken()).resolves.toBe('fresh-token');
        });
      });

      describe('and no refresh token is configured', () => {
        it.each([
          ['unset', undefined],
          ['empty', '']
        ])('returns null without calling twitch when %s', async (_, value) => {
          vi.stubEnv('TWITCH_BOT_REFRESH_TOKEN', value);

          await expect(getBotAccessToken()).resolves.toBeNull();
          expect(fetchMock).not.toHaveBeenCalled();
        });
      });

      describe('and twitch rejects the refresh', () => {
        beforeEach(() => {
          fetchMock.mockResolvedValue(textResponse('invalid refresh', 400));
        });

        it('returns null', async () => {
          await expect(getBotAccessToken()).resolves.toBeNull();
        });

        it('logs the failed status', async () => {
          await getBotAccessToken();

          expect(console.error).toHaveBeenCalledWith(
            '[Twitch] Failed to refresh bot token: 400'
          );
        });

        it('does not cache anything', async () => {
          await getBotAccessToken();

          expect(redisMock.set).not.toHaveBeenCalled();
        });
      });

      describe('and the refresh response does not match the schema', () => {
        beforeEach(() => {
          fetchMock.mockResolvedValue(jsonResponse({ expires_in: 3600 }));
        });

        it('returns null without caching anything', async () => {
          await expect(getBotAccessToken()).resolves.toBeNull();
          expect(redisMock.set).not.toHaveBeenCalled();
        });

        it('reports the provider and the call', async () => {
          await getBotAccessToken();

          expect(console.error).toHaveBeenCalledWith(
            '[provider-response]',
            JSON.stringify({
              provider: 'twitch',
              call: 'POST /oauth2/token refresh_token',
              outcome: 'rejected',
              issues: [
                {
                  path: 'access_token',
                  code: 'invalid_type',
                  expected: 'string',
                  received: 'undefined'
                }
              ]
            })
          );
        });
      });
    });
  });

  describe('invalidateAndRefreshBotToken', () => {
    it('deletes the cached token before refreshing', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'fresh-token', expires_in: 120 })
      );

      await invalidateAndRefreshBotToken();

      expect(redisMock.del).toHaveBeenCalledWith(CACHE_KEY);
      expect(redisMock.del.mock.invocationCallOrder[0]).toBeLessThan(
        fetchMock.mock.invocationCallOrder[0]
      );
    });

    it('does not read the cache', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'fresh-token', expires_in: 120 })
      );

      await invalidateAndRefreshBotToken();

      expect(redisMock.get).not.toHaveBeenCalled();
    });

    it('returns and caches the refreshed token', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'fresh-token', expires_in: 120 })
      );

      await expect(invalidateAndRefreshBotToken()).resolves.toBe('fresh-token');
      expect(redisMock.set).toHaveBeenCalledWith(CACHE_KEY, 'fresh-token', {
        ex: 60
      });
    });

    it('returns null after deleting the cache when no refresh token is configured', async () => {
      vi.stubEnv('TWITCH_BOT_REFRESH_TOKEN', undefined);

      await expect(invalidateAndRefreshBotToken()).resolves.toBeNull();
      expect(redisMock.del).toHaveBeenCalledWith(CACHE_KEY);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
