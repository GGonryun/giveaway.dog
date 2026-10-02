import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAppAccessToken } from '../get-app-access-token';
import { ApplicationError } from '@/lib/errors';
import {
  TOKEN_URL,
  formBody,
  jsonResponse,
  textResponse
} from '@/lib/twitch/__tests__/fixtures-twitch';

vi.hoisted(() => {
  vi.stubEnv('TWITCH_CLIENT_ID', 'client-id');
  vi.stubEnv('TWITCH_CLIENT_SECRET', 'client-secret');
});

const fetchMock = vi.fn<typeof fetch>();

describe('getAppAccessToken', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe('when twitch issues a token', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          access_token: 'app-token',
          expires_in: 3600,
          token_type: 'bearer'
        })
      );
    });

    it('posts a form encoded client_credentials request to the token endpoint', async () => {
      await getAppAccessToken();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(TOKEN_URL);
      expect(init?.method).toBe('POST');
      expect(init?.headers).toEqual({
        'Content-Type': 'application/x-www-form-urlencoded'
      });
    });

    it('sends the client id, client secret and grant type in the body', async () => {
      await getAppAccessToken();

      expect(formBody(fetchMock.mock.calls[0][1])).toEqual({
        client_id: 'client-id',
        client_secret: 'client-secret',
        grant_type: 'client_credentials'
      });
    });

    it('returns the access token from the response', async () => {
      await expect(getAppAccessToken()).resolves.toBe('app-token');
    });
  });

  describe('when the response has no access token', () => {
    it('returns undefined', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}));

      await expect(getAppAccessToken()).resolves.toBeUndefined();
    });
  });

  describe('when twitch rejects the request', () => {
    it('throws a BAD_REQUEST application error with the status and body', async () => {
      fetchMock.mockResolvedValue(textResponse('invalid client', 403));

      const error = await getAppAccessToken().catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Failed to create client_credentials token: 403',
        data: 'invalid client'
      });
    });
  });

  describe('when fetch itself fails', () => {
    it('propagates the network error', async () => {
      fetchMock.mockRejectedValue(new TypeError('fetch failed'));

      await expect(getAppAccessToken()).rejects.toThrow('fetch failed');
    });
  });
});
