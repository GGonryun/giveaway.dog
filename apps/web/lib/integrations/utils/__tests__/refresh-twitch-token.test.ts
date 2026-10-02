import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { refreshTwitchToken } from '../refresh-twitch-token';
import { ApplicationError } from '@/lib/errors';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';
import {
  NOW,
  NOW_SECONDS,
  EXPIRY_BUFFER_SECONDS,
  buildAccount,
  jsonResponse,
  textResponse,
  captureError,
  fetchCall,
  formBody
} from './fixtures-integrations-utils';

const fetchMock = vi.fn<typeof fetch>();

const twitchAccount = (overrides: Parameters<typeof buildAccount>[0] = {}) =>
  buildAccount({
    provider: 'twitch',
    providerAccountId: 'twitch-123',
    ...overrides
  });

const expiredAccount = (overrides: Parameters<typeof buildAccount>[0] = {}) =>
  twitchAccount({ expires_at: NOW_SECONDS - 60, ...overrides });

const accountWhere = {
  provider_providerAccountId: {
    provider: 'twitch',
    providerAccountId: 'twitch-123'
  }
};

const refresh = () =>
  refreshTwitchToken(asPrismaClient(), { userId: 'user-1' });

describe('refreshTwitchToken', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubEnv('TWITCH_CLIENT_ID', 'twitch-client-id');
    vi.stubEnv('TWITCH_CLIENT_SECRET', 'twitch-client-secret');
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('when OAuth is not configured', () => {
    it('throws INTERNAL_SERVER_ERROR when TWITCH_CLIENT_ID is missing', async () => {
      vi.stubEnv('TWITCH_CLIENT_ID', '');

      const error = await captureError(refresh());

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Twitch OAuth not configured'
      });
      expect(prismaMock.account.findFirst).not.toHaveBeenCalled();
    });

    it('throws INTERNAL_SERVER_ERROR when TWITCH_CLIENT_SECRET is missing', async () => {
      vi.stubEnv('TWITCH_CLIENT_SECRET', '');

      const error = await captureError(refresh());

      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Twitch OAuth not configured'
      });
      expect(prismaMock.account.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('when looking up the account', () => {
    it('queries the twitch account of the given user', async () => {
      prismaMock.account.findFirst.mockResolvedValue(twitchAccount());

      await refresh();

      expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', provider: 'twitch' }
      });
    });

    it('throws NOT_FOUND when the user has no twitch account', async () => {
      prismaMock.account.findFirst.mockResolvedValue(null);

      const error = await captureError(refresh());

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'NOT_FOUND',
        message: 'Twitch account not found'
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('throws BAD_REQUEST when the account has no access token', async () => {
      prismaMock.account.findFirst.mockResolvedValue(
        twitchAccount({ access_token: null })
      );

      const error = await captureError(refresh());

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'No access token available'
      });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(prismaMock.account.update).not.toHaveBeenCalled();
    });

    it('throws BAD_REQUEST when the access token is an empty string', async () => {
      prismaMock.account.findFirst.mockResolvedValue(
        twitchAccount({ access_token: '' })
      );

      const error = await captureError(refresh());

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'No access token available'
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('when the stored token is still valid', () => {
    it('returns the stored token without calling twitch', async () => {
      prismaMock.account.findFirst.mockResolvedValue(
        twitchAccount({ expires_at: NOW_SECONDS + 3600 })
      );

      const result = await refresh();

      expect(result).toEqual({
        access_token: 'current-access-token',
        expires_at: NOW_SECONDS + 3600
      });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(prismaMock.account.update).not.toHaveBeenCalled();
    });

    it('treats a token expiring one second after the buffer as valid', async () => {
      const expiresAt = NOW_SECONDS + EXPIRY_BUFFER_SECONDS + 1;
      prismaMock.account.findFirst.mockResolvedValue(
        twitchAccount({ expires_at: expiresAt })
      );

      const result = await refresh();

      expect(result).toEqual({
        access_token: 'current-access-token',
        expires_at: expiresAt
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('logs the remaining lifetime in whole minutes', async () => {
      prismaMock.account.findFirst.mockResolvedValue(
        twitchAccount({ expires_at: NOW_SECONDS + 3659 })
      );

      await refresh();

      expect(console.info).toHaveBeenCalledWith(
        '[Twitch Token] Using existing token',
        {
          userId: 'user-1',
          accountProvider: 'twitch',
          expiresIn: '60 minutes',
          expiresAt: '2026-01-01T01:00:59.000Z'
        }
      );
    });

    it('logs a lifetime of exactly one hour as 60 minutes', async () => {
      prismaMock.account.findFirst.mockResolvedValue(
        twitchAccount({ expires_at: NOW_SECONDS + 3600 })
      );

      await refresh();

      expect(console.info).toHaveBeenCalledWith(
        '[Twitch Token] Using existing token',
        expect.objectContaining({ expiresIn: '60 minutes' })
      );
    });

    it('truncates the current time to whole seconds when checking expiry', async () => {
      vi.setSystemTime(new Date(NOW.getTime() + 999));
      const expiresAt = NOW_SECONDS + EXPIRY_BUFFER_SECONDS + 1;
      prismaMock.account.findFirst.mockResolvedValue(
        twitchAccount({ expires_at: expiresAt })
      );

      const result = await refresh();

      expect(result).toEqual({
        access_token: 'current-access-token',
        expires_at: expiresAt
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('when the stored token is expired', () => {
    it('refreshes a token that expires exactly at the buffer boundary', async () => {
      prismaMock.account.findFirst.mockResolvedValue(
        twitchAccount({ expires_at: NOW_SECONDS + EXPIRY_BUFFER_SECONDS })
      );
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-token', expires_in: 600, scope: [] })
      );

      const result = await refresh();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.access_token).toBe('new-token');
    });

    it('refreshes when the account has no expiry and logs it as unknown', async () => {
      prismaMock.account.findFirst.mockResolvedValue(
        twitchAccount({ expires_at: null })
      );
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-token', expires_in: 600, scope: [] })
      );

      await refresh();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveBeenCalledWith(
        '[Twitch Token] Token expired, refreshing',
        {
          userId: 'user-1',
          accountProvider: 'twitch',
          expiredAt: 'unknown',
          expiryBuffer: '300s'
        }
      );
    });

    it('logs the previous expiry time before refreshing', async () => {
      prismaMock.account.findFirst.mockResolvedValue(expiredAccount());
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-token', expires_in: 600, scope: [] })
      );

      await refresh();

      expect(console.info).toHaveBeenCalledWith(
        '[Twitch Token] Token expired, refreshing',
        {
          userId: 'user-1',
          accountProvider: 'twitch',
          expiredAt: '2025-12-31T23:59:00.000Z',
          expiryBuffer: '300s'
        }
      );
    });

    it('marks the account as ERROR and throws UNAUTHORIZED when there is no refresh token', async () => {
      prismaMock.account.findFirst.mockResolvedValue(
        expiredAccount({ refresh_token: null })
      );

      const error = await captureError(refresh());

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Token expired and no refresh token available'
      });
      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: accountWhere,
        data: { status: 'ERROR' }
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects with the database error when marking an account without a refresh token fails', async () => {
      const dbError = new Error('database unavailable');
      prismaMock.account.findFirst.mockResolvedValue(
        expiredAccount({ refresh_token: null })
      );
      prismaMock.account.update.mockRejectedValue(dbError);

      const error = await captureError(refresh());

      expect(error).toBe(dbError);
    });

    it('posts a form-encoded refresh request to twitch', async () => {
      prismaMock.account.findFirst.mockResolvedValue(expiredAccount());
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-token', expires_in: 600, scope: [] })
      );

      await refresh();

      const { url, init } = fetchCall(fetchMock);
      expect(url).toBe('https://id.twitch.tv/oauth2/token');
      expect(init.method).toBe('POST');
      expect(init.headers).toEqual({
        'Content-Type': 'application/x-www-form-urlencoded'
      });
      expect(formBody(init)).toEqual({
        grant_type: 'refresh_token',
        refresh_token: 'refresh-token-abcdefghij',
        client_id: 'twitch-client-id',
        client_secret: 'twitch-client-secret'
      });
    });
  });

  describe('when twitch refreshes the token', () => {
    beforeEach(() => {
      prismaMock.account.findFirst.mockResolvedValue(expiredAccount());
    });

    it('stores the new tokens with space-joined scopes and reactivates the account', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 7200,
          scope: ['user:read:email', 'channel:read:subscriptions'],
          token_type: 'bearer'
        })
      );

      await refresh();

      expect(prismaMock.account.update).toHaveBeenCalledTimes(1);
      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: accountWhere,
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_at: NOW_SECONDS + 7200,
          scope: 'user:read:email channel:read:subscriptions',
          token_type: 'bearer',
          status: 'ACTIVE'
        }
      });
    });

    it('stores an empty scope string when twitch returns no scopes', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          access_token: 'new-access-token',
          expires_in: 600,
          scope: []
        })
      );

      await refresh();

      expect(prismaMock.account.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ scope: '' })
        })
      );
    });

    it('rejects with a TypeError and stores nothing when the scope is not an array', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          access_token: 'new-access-token',
          expires_in: 600,
          scope: 'user:read:email'
        })
      );

      const error = await captureError(refresh());

      expect(error).toBeInstanceOf(TypeError);
      expect(error).toMatchObject({
        message: expect.stringContaining('join is not a function')
      });
      expect(prismaMock.account.update).not.toHaveBeenCalled();
    });

    it('rejects with a TypeError and stores nothing when the scope is missing', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-access-token', expires_in: 600 })
      );

      const error = await captureError(refresh());

      expect(error).toBeInstanceOf(TypeError);
      expect(error).toMatchObject({
        message: expect.stringContaining("reading 'join'")
      });
      expect(prismaMock.account.update).not.toHaveBeenCalled();
    });

    it('returns the new access token and absolute expiry', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          access_token: 'new-access-token',
          expires_in: 7200,
          scope: []
        })
      );

      const result = await refresh();

      expect(result).toEqual({
        access_token: 'new-access-token',
        expires_at: NOW_SECONDS + 7200
      });
    });

    it('keeps the existing refresh token when twitch does not return one', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          access_token: 'new-access-token',
          expires_in: 600,
          scope: []
        })
      );

      await refresh();

      expect(prismaMock.account.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            refresh_token: 'refresh-token-abcdefghij',
            token_type: undefined
          })
        })
      );
    });

    it('keeps the existing refresh token when twitch returns an empty one', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          access_token: 'new-access-token',
          refresh_token: '',
          expires_in: 600,
          scope: []
        })
      );

      await refresh();

      expect(prismaMock.account.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            refresh_token: 'refresh-token-abcdefghij'
          })
        })
      );
    });

    it('computes the new expiry from the current time truncated to whole seconds', async () => {
      vi.setSystemTime(new Date(NOW.getTime() + 999));
      fetchMock.mockResolvedValue(
        jsonResponse({
          access_token: 'new-access-token',
          expires_in: 600,
          scope: []
        })
      );

      const result = await refresh();

      expect(result.expires_at).toBe(NOW_SECONDS + 600);
      expect(prismaMock.account.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ expires_at: NOW_SECONDS + 600 })
        })
      );
    });

    it('rejects with the database error when storing the new tokens fails', async () => {
      const dbError = new Error('database unavailable');
      prismaMock.account.update.mockRejectedValue(dbError);
      fetchMock.mockResolvedValue(
        jsonResponse({
          access_token: 'new-access-token',
          expires_in: 600,
          scope: []
        })
      );

      const error = await captureError(refresh());

      expect(error).toBe(dbError);
      expect(console.info).not.toHaveBeenCalledWith(
        '[Twitch Token] Token refreshed successfully',
        expect.anything()
      );
    });

    it('logs the new expiry after refreshing', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          access_token: 'new-access-token',
          expires_in: 3599,
          scope: []
        })
      );

      await refresh();

      expect(console.info).toHaveBeenCalledWith(
        '[Twitch Token] Token refreshed successfully',
        {
          userId: 'user-1',
          accountProvider: 'twitch',
          newExpiresAt: '2026-01-01T00:59:59.000Z',
          expiresIn: '59 minutes'
        }
      );
    });
  });

  describe('when twitch rejects the refresh', () => {
    beforeEach(() => {
      prismaMock.account.findFirst.mockResolvedValue(expiredAccount());
    });

    it.each([401, 403])(
      'marks the account as ERROR for status %i',
      async (status) => {
        fetchMock.mockResolvedValue(
          jsonResponse({ error: 'invalid_grant' }, { status })
        );

        await captureError(refresh());

        expect(prismaMock.account.update).toHaveBeenCalledTimes(1);
        expect(prismaMock.account.update).toHaveBeenCalledWith({
          where: accountWhere,
          data: { status: 'ERROR' }
        });
      }
    );

    it.each([401, 403])(
      'throws UNAUTHORIZED with the twitch error details for status %i',
      async (status) => {
        fetchMock.mockResolvedValue(
          jsonResponse({ error: 'invalid_grant' }, { status })
        );

        const error = await captureError(refresh());

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toMatchObject({
          code: 'UNAUTHORIZED',
          message: 'Failed to refresh Twitch access token',
          cause: '{"error":"invalid_grant"}',
          data: {
            twitchError: { error: 'invalid_grant' },
            statusCode: status
          }
        });
      }
    );

    it('rejects with the database error when marking the account as ERROR fails', async () => {
      const dbError = new Error('database unavailable');
      prismaMock.account.update.mockRejectedValue(dbError);
      fetchMock.mockResolvedValue(
        jsonResponse({ error: 'invalid_grant' }, { status: 401 })
      );

      const error = await captureError(refresh());

      expect(error).toBe(dbError);
    });

    it.each([400, 429, 500])(
      'leaves the account status untouched for status %i',
      async (status) => {
        fetchMock.mockResolvedValue(
          jsonResponse({ message: 'nope' }, { status })
        );

        await captureError(refresh());

        expect(prismaMock.account.update).not.toHaveBeenCalled();
      }
    );

    it.each([400, 429, 500])(
      'throws INTERNAL_SERVER_ERROR for status %i',
      async (status) => {
        fetchMock.mockResolvedValue(
          jsonResponse({ message: 'nope' }, { status })
        );

        const error = await captureError(refresh());

        expect(error).toMatchObject({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to refresh Twitch access token',
          cause: '{"message":"nope"}',
          data: {
            twitchError: { message: 'nope' },
            statusCode: status
          }
        });
      }
    );

    it('logs the failure with a truncated refresh token preview', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ error: 'invalid_grant' }, { status: 400 })
      );

      await captureError(refresh());

      expect(console.error).toHaveBeenCalledWith(
        'Twitch token refresh failed:',
        {
          status: 400,
          error: { error: 'invalid_grant' },
          refreshTokenLength: 24,
          refreshTokenPreview: 'refresh-to...'
        }
      );
    });

    it('rejects with the JSON parse error when the error body is not JSON', async () => {
      fetchMock.mockResolvedValue(textResponse('Unauthorized', 401));

      const error = await captureError(refresh());

      expect(error).toBeInstanceOf(SyntaxError);
      expect(prismaMock.account.update).not.toHaveBeenCalled();
    });
  });

  describe('when the refresh request cannot be sent', () => {
    it('propagates the network error without updating the account', async () => {
      prismaMock.account.findFirst.mockResolvedValue(expiredAccount());
      fetchMock.mockRejectedValue(new TypeError('fetch failed'));

      const error = await captureError(refresh());

      expect(error).toBeInstanceOf(TypeError);
      expect(error).toMatchObject({ message: 'fetch failed' });
      expect(prismaMock.account.update).not.toHaveBeenCalled();
    });
  });
});
