import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { refreshKickToken } from '../refresh-kick-token';
import { ApplicationError } from '@/lib/errors';
import { prismaMock, asPrismaClient } from '@/test/prisma';
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

const kickAccount = (overrides: Parameters<typeof buildAccount>[0] = {}) =>
  buildAccount({
    provider: 'kick',
    providerAccountId: 'kick-123',
    ...overrides
  });

const expiredAccount = (overrides: Parameters<typeof buildAccount>[0] = {}) =>
  kickAccount({ expires_at: NOW_SECONDS - 60, ...overrides });

const accountWhere = {
  provider_providerAccountId: {
    provider: 'kick',
    providerAccountId: 'kick-123'
  }
};

const refresh = () => refreshKickToken(asPrismaClient(), { userId: 'user-1' });

describe('refreshKickToken', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubEnv('KICK_CLIENT_ID', 'kick-client-id');
    vi.stubEnv('KICK_CLIENT_SECRET', 'kick-client-secret');
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
    it('throws INTERNAL_SERVER_ERROR when KICK_CLIENT_ID is missing', async () => {
      vi.stubEnv('KICK_CLIENT_ID', '');

      const error = await captureError(refresh());

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Kick OAuth not configured'
      });
      expect(prismaMock.account.findFirst).not.toHaveBeenCalled();
    });

    it('throws INTERNAL_SERVER_ERROR when KICK_CLIENT_SECRET is missing', async () => {
      vi.stubEnv('KICK_CLIENT_SECRET', '');

      const error = await captureError(refresh());

      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Kick OAuth not configured'
      });
      expect(prismaMock.account.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('when looking up the account', () => {
    it('queries the kick account of the given user', async () => {
      prismaMock.account.findFirst.mockResolvedValue(kickAccount());

      await refresh();

      expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', provider: 'kick' }
      });
    });

    it('throws NOT_FOUND when the user has no kick account', async () => {
      prismaMock.account.findFirst.mockResolvedValue(null);

      const error = await captureError(refresh());

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'NOT_FOUND',
        message: 'Kick account not found'
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('throws BAD_REQUEST when the account has no access token', async () => {
      prismaMock.account.findFirst.mockResolvedValue(
        kickAccount({ access_token: null })
      );

      const error = await captureError(refresh());

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'No access token available'
      });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(prismaMock.account.update).not.toHaveBeenCalled();
    });
  });

  describe('when the stored token is still valid', () => {
    it('returns the stored token without calling kick', async () => {
      prismaMock.account.findFirst.mockResolvedValue(
        kickAccount({ expires_at: NOW_SECONDS + 3600 })
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
        kickAccount({ expires_at: expiresAt })
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
        kickAccount({ expires_at: NOW_SECONDS + 3659 })
      );

      await refresh();

      expect(console.info).toHaveBeenCalledWith(
        '[Kick Token] Using existing token',
        {
          userId: 'user-1',
          accountProvider: 'kick',
          expiresIn: '60 minutes',
          expiresAt: '2026-01-01T01:00:59.000Z'
        }
      );
    });
  });

  describe('when the stored token is expired', () => {
    it('refreshes a token that expires exactly at the buffer boundary', async () => {
      prismaMock.account.findFirst.mockResolvedValue(
        kickAccount({ expires_at: NOW_SECONDS + EXPIRY_BUFFER_SECONDS })
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
        kickAccount({ expires_at: null })
      );
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-token', expires_in: 600 })
      );

      await refresh();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveBeenCalledWith(
        '[Kick Token] Token expired, refreshing',
        {
          userId: 'user-1',
          accountProvider: 'kick',
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
        '[Kick Token] Token expired, refreshing',
        {
          userId: 'user-1',
          accountProvider: 'kick',
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

    it('posts a form-encoded refresh request to kick', async () => {
      prismaMock.account.findFirst.mockResolvedValue(expiredAccount());
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-token', expires_in: 600 })
      );

      await refresh();

      const { url, init } = fetchCall(fetchMock);
      expect(url).toBe('https://id.kick.com/oauth/token');
      expect(init.method).toBe('POST');
      expect(init.headers).toEqual({
        'Content-Type': 'application/x-www-form-urlencoded'
      });
      expect(formBody(init)).toEqual({
        grant_type: 'refresh_token',
        refresh_token: 'refresh-token-abcdefghij',
        client_id: 'kick-client-id',
        client_secret: 'kick-client-secret'
      });
    });
  });

  describe('when kick refreshes the token', () => {
    beforeEach(() => {
      prismaMock.account.findFirst.mockResolvedValue(expiredAccount());
    });

    it('stores the new tokens and reactivates the account', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 7200,
          scope: 'user:read channel:read',
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
          expires_at: NOW_SECONDS + 7200,
          scope: 'user:read channel:read',
          token_type: 'Bearer',
          status: 'ACTIVE'
        }
      });
    });

    it('returns the new access token and absolute expiry', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-access-token', expires_in: 7200 })
      );

      const result = await refresh();

      expect(result).toEqual({
        access_token: 'new-access-token',
        expires_at: NOW_SECONDS + 7200
      });
    });

    it('keeps the existing refresh token when kick does not return one', async () => {
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

    it('logs the new expiry after refreshing', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-access-token', expires_in: 3599 })
      );

      await refresh();

      expect(console.info).toHaveBeenCalledWith(
        '[Kick Token] Token refreshed successfully',
        {
          userId: 'user-1',
          accountProvider: 'kick',
          newExpiresAt: '2026-01-01T00:59:59.000Z',
          expiresIn: '59 minutes'
        }
      );
    });
  });

  describe('when kick rejects the refresh', () => {
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
      'throws UNAUTHORIZED with the kick error details for status %i',
      async (status) => {
        fetchMock.mockResolvedValue(
          jsonResponse({ error: 'invalid_grant' }, { status })
        );

        const error = await captureError(refresh());

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toMatchObject({
          code: 'UNAUTHORIZED',
          message: 'Failed to refresh Kick access token',
          cause: '{"error":"invalid_grant"}',
          data: {
            kickError: { error: 'invalid_grant' },
            statusCode: status
          }
        });
      }
    );

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
          message: 'Failed to refresh Kick access token',
          cause: '{"message":"nope"}',
          data: {
            kickError: { message: 'nope' },
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

      expect(console.error).toHaveBeenCalledWith('Kick token refresh failed:', {
        status: 400,
        error: { error: 'invalid_grant' },
        refreshTokenLength: 24,
        refreshTokenPreview: 'refresh-to...'
      });
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
