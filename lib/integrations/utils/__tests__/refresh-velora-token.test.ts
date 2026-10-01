import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { refreshVeloraToken } from '../refresh-velora-token';
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
  fetchCall
} from './fixtures-integrations-utils';

const fetchMock = vi.fn<typeof fetch>();

const veloraAccount = (overrides: Parameters<typeof buildAccount>[0] = {}) =>
  buildAccount({
    provider: 'velora',
    providerAccountId: 'velora-123',
    ...overrides
  });

const expiredAccount = (overrides: Parameters<typeof buildAccount>[0] = {}) =>
  veloraAccount({ expires_at: NOW_SECONDS - 60, ...overrides });

const accountWhere = {
  provider_providerAccountId: {
    provider: 'velora',
    providerAccountId: 'velora-123'
  }
};

const refresh = () =>
  refreshVeloraToken(asPrismaClient(), { userId: 'user-1' });

describe('refreshVeloraToken', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubEnv('VELORA_CLIENT_ID', 'velora-client-id');
    vi.stubEnv('VELORA_CLIENT_SECRET', 'velora-client-secret');
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
    it('throws INTERNAL_SERVER_ERROR when VELORA_CLIENT_ID is missing', async () => {
      vi.stubEnv('VELORA_CLIENT_ID', '');

      const error = await captureError(refresh());

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Velora OAuth not configured'
      });
      expect(prismaMock.account.findFirst).not.toHaveBeenCalled();
    });

    it('throws INTERNAL_SERVER_ERROR when VELORA_CLIENT_SECRET is missing', async () => {
      vi.stubEnv('VELORA_CLIENT_SECRET', '');

      const error = await captureError(refresh());

      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Velora OAuth not configured'
      });
      expect(prismaMock.account.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('when looking up the account', () => {
    it('queries the velora account of the given user', async () => {
      prismaMock.account.findFirst.mockResolvedValue(veloraAccount());

      await refresh();

      expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', provider: 'velora' }
      });
    });

    it('throws NOT_FOUND when the user has no velora account', async () => {
      prismaMock.account.findFirst.mockResolvedValue(null);

      const error = await captureError(refresh());

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'NOT_FOUND',
        message: 'Velora account not found'
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('throws BAD_REQUEST when the account has no access token', async () => {
      prismaMock.account.findFirst.mockResolvedValue(
        veloraAccount({ access_token: null })
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
    it('returns the stored token without calling velora', async () => {
      prismaMock.account.findFirst.mockResolvedValue(
        veloraAccount({ expires_at: NOW_SECONDS + 3600 })
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
        veloraAccount({ expires_at: expiresAt })
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
        veloraAccount({ expires_at: NOW_SECONDS + 3659 })
      );

      await refresh();

      expect(console.info).toHaveBeenCalledWith(
        '[Velora Token] Using existing token',
        {
          userId: 'user-1',
          accountProvider: 'velora',
          expiresIn: '60 minutes',
          expiresAt: '2026-01-01T01:00:59.000Z'
        }
      );
    });
  });

  describe('when the stored token is expired', () => {
    it('refreshes a token that expires exactly at the buffer boundary', async () => {
      prismaMock.account.findFirst.mockResolvedValue(
        veloraAccount({ expires_at: NOW_SECONDS + EXPIRY_BUFFER_SECONDS })
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
        veloraAccount({ expires_at: null })
      );
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-token', expires_in: 600 })
      );

      await refresh();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveBeenCalledWith(
        '[Velora Token] Token expired, refreshing',
        {
          userId: 'user-1',
          accountProvider: 'velora',
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
        '[Velora Token] Token expired, refreshing',
        {
          userId: 'user-1',
          accountProvider: 'velora',
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

    it('posts a JSON refresh request to velora', async () => {
      prismaMock.account.findFirst.mockResolvedValue(expiredAccount());
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-token', expires_in: 600 })
      );

      await refresh();

      const { url, init } = fetchCall(fetchMock);
      expect(url).toBe('https://api.velora.tv/api/developer/oauth/token');
      expect(init.method).toBe('POST');
      expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
      expect(init.body).toBe(
        JSON.stringify({
          grant_type: 'refresh_token',
          client_id: 'velora-client-id',
          client_secret: 'velora-client-secret',
          refresh_token: 'refresh-token-abcdefghij'
        })
      );
    });
  });

  describe('when velora refreshes the token', () => {
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

    it('joins an array of scopes with spaces', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          access_token: 'new-access-token',
          expires_in: 7200,
          scope: ['user:read', 'channel:read']
        })
      );

      await refresh();

      expect(prismaMock.account.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ scope: 'user:read channel:read' })
        })
      );
    });

    it('stores an empty scope string for an empty scope array', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          access_token: 'new-access-token',
          expires_in: 7200,
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

    it('keeps the existing refresh token when velora does not return one', async () => {
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
        '[Velora Token] Token refreshed successfully',
        {
          userId: 'user-1',
          accountProvider: 'velora',
          newExpiresAt: '2026-01-01T00:59:59.000Z',
          expiresIn: '59 minutes'
        }
      );
    });
  });

  describe('when velora rejects the refresh', () => {
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
      'throws UNAUTHORIZED with the velora error details for status %i',
      async (status) => {
        fetchMock.mockResolvedValue(
          jsonResponse({ error: 'invalid_grant' }, { status })
        );

        const error = await captureError(refresh());

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toMatchObject({
          code: 'UNAUTHORIZED',
          message: 'Failed to refresh Velora access token',
          cause: '{"error":"invalid_grant"}',
          data: {
            veloraError: { error: 'invalid_grant' },
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
          message: 'Failed to refresh Velora access token',
          cause: '{"message":"nope"}',
          data: {
            veloraError: { message: 'nope' },
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
        'Velora token refresh failed:',
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
