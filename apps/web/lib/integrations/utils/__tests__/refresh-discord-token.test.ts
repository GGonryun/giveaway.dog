import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { refreshDiscordToken } from '../refresh-discord-token';
import { ApplicationError } from '@giveaway/util-errors';
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

const discordAccount = (overrides: Parameters<typeof buildAccount>[0] = {}) =>
  buildAccount({
    provider: 'discord',
    providerAccountId: 'discord-123',
    ...overrides
  });

const expiredAccount = (overrides: Parameters<typeof buildAccount>[0] = {}) =>
  discordAccount({ expires_at: NOW_SECONDS - 60, ...overrides });

const accountWhere = {
  provider_providerAccountId: {
    provider: 'discord',
    providerAccountId: 'discord-123'
  }
};

const refresh = () =>
  refreshDiscordToken(asPrismaClient(), { userId: 'user-1' });

describe('refreshDiscordToken', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubEnv('DISCORD_ID', 'discord-client-id');
    vi.stubEnv('DISCORD_SECRET', 'discord-client-secret');
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
    it('throws INTERNAL_SERVER_ERROR when DISCORD_ID is missing', async () => {
      vi.stubEnv('DISCORD_ID', '');

      const error = await captureError(refresh());

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Discord OAuth not configured'
      });
      expect(prismaMock.account.findFirst).not.toHaveBeenCalled();
    });

    it('throws INTERNAL_SERVER_ERROR when DISCORD_SECRET is missing', async () => {
      vi.stubEnv('DISCORD_SECRET', '');

      const error = await captureError(refresh());

      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Discord OAuth not configured'
      });
      expect(prismaMock.account.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('when looking up the account', () => {
    it('queries the discord account of the given user', async () => {
      prismaMock.account.findFirst.mockResolvedValue(discordAccount());

      await refresh();

      expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', provider: 'discord' }
      });
    });

    it('throws NOT_FOUND when the user has no discord account', async () => {
      prismaMock.account.findFirst.mockResolvedValue(null);

      const error = await captureError(refresh());

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'NOT_FOUND',
        message: 'Discord account not found'
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('throws BAD_REQUEST when the account has no access token', async () => {
      prismaMock.account.findFirst.mockResolvedValue(
        discordAccount({ access_token: null })
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
        discordAccount({ access_token: '' })
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
    it('returns the stored token without calling discord', async () => {
      prismaMock.account.findFirst.mockResolvedValue(
        discordAccount({ expires_at: NOW_SECONDS + 3600 })
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
        discordAccount({ expires_at: expiresAt })
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
        discordAccount({ expires_at: NOW_SECONDS + 3659 })
      );

      await refresh();

      expect(console.info).toHaveBeenCalledWith(
        '[Discord Token] Using existing token',
        {
          userId: 'user-1',
          accountProvider: 'discord',
          expiresIn: '60 minutes',
          expiresAt: '2026-01-01T01:00:59.000Z'
        }
      );
    });

    it('logs a lifetime of exactly one hour as 60 minutes', async () => {
      prismaMock.account.findFirst.mockResolvedValue(
        discordAccount({ expires_at: NOW_SECONDS + 3600 })
      );

      await refresh();

      expect(console.info).toHaveBeenCalledWith(
        '[Discord Token] Using existing token',
        expect.objectContaining({ expiresIn: '60 minutes' })
      );
    });

    it('truncates the current time to whole seconds when checking expiry', async () => {
      vi.setSystemTime(new Date(NOW.getTime() + 999));
      const expiresAt = NOW_SECONDS + EXPIRY_BUFFER_SECONDS + 1;
      prismaMock.account.findFirst.mockResolvedValue(
        discordAccount({ expires_at: expiresAt })
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
        discordAccount({ expires_at: NOW_SECONDS + EXPIRY_BUFFER_SECONDS })
      );
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-token', expires_in: 600 })
      );

      const result = await refresh();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.access_token).toBe('new-token');
    });

    it('refreshes when the account has no expiry and logs it as unknown', async () => {
      prismaMock.account.findFirst.mockResolvedValue(
        discordAccount({ expires_at: null })
      );
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-token', expires_in: 600 })
      );

      await refresh();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveBeenCalledWith(
        '[Discord Token] Token expired, refreshing',
        {
          userId: 'user-1',
          accountProvider: 'discord',
          expiredAt: 'unknown',
          expiryBuffer: '300s'
        }
      );
    });

    it('logs the previous expiry time before refreshing', async () => {
      prismaMock.account.findFirst.mockResolvedValue(expiredAccount());
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-token', expires_in: 600 })
      );

      await refresh();

      expect(console.info).toHaveBeenCalledWith(
        '[Discord Token] Token expired, refreshing',
        {
          userId: 'user-1',
          accountProvider: 'discord',
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

    it('posts a form-encoded refresh request to discord', async () => {
      prismaMock.account.findFirst.mockResolvedValue(expiredAccount());
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-token', expires_in: 600 })
      );

      await refresh();

      const { url, init } = fetchCall(fetchMock);
      expect(url).toBe('https://discord.com/api/oauth2/token');
      expect(init.method).toBe('POST');
      expect(init.headers).toEqual({
        'Content-Type': 'application/x-www-form-urlencoded'
      });
      expect(formBody(init)).toEqual({
        grant_type: 'refresh_token',
        refresh_token: 'refresh-token-abcdefghij',
        client_id: 'discord-client-id',
        client_secret: 'discord-client-secret'
      });
    });
  });

  describe('when discord refreshes the token', () => {
    beforeEach(() => {
      prismaMock.account.findFirst.mockResolvedValue(expiredAccount());
    });

    it('stores the new tokens and reactivates the account', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 604800,
          scope: 'identify guilds',
          token_type: 'Bearer'
        })
      );

      await refresh();

      expect(prismaMock.account.update).toHaveBeenCalledTimes(1);
      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: accountWhere,
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_at: NOW_SECONDS + 604800,
          scope: 'identify guilds',
          token_type: 'Bearer',
          status: 'ACTIVE'
        }
      });
    });

    it('returns the new access token and absolute expiry', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-access-token', expires_in: 604800 })
      );

      const result = await refresh();

      expect(result).toEqual({
        access_token: 'new-access-token',
        expires_at: NOW_SECONDS + 604800
      });
    });

    it('keeps the existing refresh token when discord does not return one', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-access-token', expires_in: 600 })
      );

      await refresh();

      expect(prismaMock.account.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            refresh_token: 'refresh-token-abcdefghij',
            scope: undefined,
            token_type: undefined
          })
        })
      );
    });

    it('keeps the existing refresh token when discord returns an empty one', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          access_token: 'new-access-token',
          refresh_token: '',
          expires_in: 600
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
        jsonResponse({ access_token: 'new-access-token', expires_in: 600 })
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
        jsonResponse({ access_token: 'new-access-token', expires_in: 600 })
      );

      const error = await captureError(refresh());

      expect(error).toBe(dbError);
      expect(console.info).not.toHaveBeenCalledWith(
        '[Discord Token] Token refreshed successfully',
        expect.anything()
      );
    });

    it('logs the new expiry after refreshing', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-access-token', expires_in: 3599 })
      );

      await refresh();

      expect(console.info).toHaveBeenCalledWith(
        '[Discord Token] Token refreshed successfully',
        {
          userId: 'user-1',
          accountProvider: 'discord',
          newExpiresAt: '2026-01-01T00:59:59.000Z',
          expiresIn: '59 minutes'
        }
      );
    });
  });

  describe('when discord rejects the refresh', () => {
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

    it('throws UNAUTHORIZED with the discord error details', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ error: 'invalid_grant' }, { status: 401 })
      );

      const error = await captureError(refresh());

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Failed to refresh Discord access token',
        cause: '{"error":"invalid_grant"}',
        data: {
          discordError: { error: 'invalid_grant' },
          statusCode: 401
        }
      });
    });

    it('rejects with the database error when marking the account as ERROR fails', async () => {
      const dbError = new Error('database unavailable');
      prismaMock.account.update.mockRejectedValue(dbError);
      fetchMock.mockResolvedValue(
        jsonResponse({ error: 'invalid_grant' }, { status: 401 })
      );

      const error = await captureError(refresh());

      expect(error).toBe(dbError);
    });

    it('leaves the account status untouched for a server error', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ message: 'upstream down' }, { status: 500 })
      );

      await captureError(refresh());

      expect(prismaMock.account.update).not.toHaveBeenCalled();
    });

    it('still throws UNAUTHORIZED for a server error', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ message: 'upstream down' }, { status: 500 })
      );

      const error = await captureError(refresh());

      expect(error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Failed to refresh Discord access token',
        data: {
          discordError: { message: 'upstream down' },
          statusCode: 500
        }
      });
    });

    it('logs the failure with a truncated refresh token preview', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ error: 'invalid_grant' }, { status: 400 })
      );

      await captureError(refresh());

      expect(console.error).toHaveBeenCalledWith(
        'Discord token refresh failed:',
        {
          status: 400,
          error: { error: 'invalid_grant' },
          refreshTokenLength: 24,
          refreshTokenPreview: 'refresh-to...'
        }
      );
    });

    it('rejects with the JSON parse error when the error body is not JSON', async () => {
      fetchMock.mockResolvedValue(textResponse('Bad Gateway', 401));

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
