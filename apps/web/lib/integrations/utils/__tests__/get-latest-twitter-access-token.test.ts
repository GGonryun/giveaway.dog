import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getLatestTwitterAccessToken } from '../get-latest-twitter-access-token';
import { ApplicationError } from '@giveaway/util-errors';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';
import {
  NOW,
  NOW_SECONDS,
  EXPIRY_BUFFER_SECONDS,
  buildIntegration,
  jsonResponse,
  textResponse,
  captureError,
  fetchCall,
  formBody
} from './fixtures-integrations-utils';

vi.hoisted(() => {
  vi.stubEnv('TWITTER_TEAM_APP_CLIENT_ID', 'twitter-client-id');
  vi.stubEnv('TWITTER_TEAM_APP_CLIENT_SECRET', 'twitter-client-secret');
});

const fetchMock = vi.fn<typeof fetch>();

const expiredIntegration = (
  overrides: Parameters<typeof buildIntegration>[0] = {}
) => buildIntegration({ expires_at: NOW_SECONDS - 60, ...overrides });

const getToken = (integrationId?: string) =>
  getLatestTwitterAccessToken(asPrismaClient(), {
    teamId: 'team-1',
    integrationId
  });

describe('getLatestTwitterAccessToken', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
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

  describe('when the twitter team app is not configured', () => {
    const loadUnconfigured = async (env: {
      clientId: string;
      clientSecret: string;
    }) => {
      vi.stubEnv('TWITTER_TEAM_APP_CLIENT_ID', env.clientId);
      vi.stubEnv('TWITTER_TEAM_APP_CLIENT_SECRET', env.clientSecret);
      vi.resetModules();
      const errors = await import('@giveaway/util-errors');
      const mod = await import('../get-latest-twitter-access-token');
      return { ApplicationErrorClass: errors.ApplicationError, mod };
    };

    it('throws INTERNAL_SERVER_ERROR when the client id is missing', async () => {
      const { ApplicationErrorClass, mod } = await loadUnconfigured({
        clientId: '',
        clientSecret: 'twitter-client-secret'
      });

      const error = await captureError(
        mod.getLatestTwitterAccessToken(asPrismaClient(), { teamId: 'team-1' })
      );

      expect(error).toBeInstanceOf(ApplicationErrorClass);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Twitter OAuth not configured'
      });
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
    });

    it('throws INTERNAL_SERVER_ERROR when the client secret is missing', async () => {
      const { ApplicationErrorClass, mod } = await loadUnconfigured({
        clientId: 'twitter-client-id',
        clientSecret: ''
      });

      const error = await captureError(
        mod.getLatestTwitterAccessToken(asPrismaClient(), { teamId: 'team-1' })
      );

      expect(error).toBeInstanceOf(ApplicationErrorClass);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Twitter OAuth not configured'
      });
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('when looking up the integration', () => {
    it('queries the specific twitter integration of the team when an id is given', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(buildIntegration());

      await getToken('integration-1');

      expect(prismaMock.integration.findFirst).toHaveBeenCalledTimes(1);
      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: { id: 'integration-1', teamId: 'team-1', provider: 'TWITTER' }
      });
    });

    it('queries any twitter integration of the team when no id is given', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(buildIntegration());

      await getToken();

      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: { teamId: 'team-1', provider: 'TWITTER' }
      });
    });

    it('ignores an empty integration id', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(buildIntegration());

      await getToken('');

      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: { teamId: 'team-1', provider: 'TWITTER' }
      });
    });

    it('throws NOT_FOUND when the integration does not exist', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      const error = await captureError(getToken('integration-1'));

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'NOT_FOUND',
        message: 'Twitter integration not found'
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('throws BAD_REQUEST when the integration has no access token', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(
        buildIntegration({ access_token: null })
      );

      const error = await captureError(getToken());

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'No access token available'
      });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });

    it('throws BAD_REQUEST when the access token is an empty string', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(
        buildIntegration({ access_token: '' })
      );

      const error = await captureError(getToken());

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'No access token available'
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('when the stored token is still valid', () => {
    it('returns the stored token without calling twitter', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(
        buildIntegration({ expires_at: NOW_SECONDS + 7200 })
      );

      const result = await getToken();

      expect(result).toEqual({
        access_token: 'twitter-access-token',
        expires_at: NOW_SECONDS + 7200
      });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });

    it('treats a token expiring one second after the buffer as valid', async () => {
      const expiresAt = NOW_SECONDS + EXPIRY_BUFFER_SECONDS + 1;
      prismaMock.integration.findFirst.mockResolvedValue(
        buildIntegration({ expires_at: expiresAt })
      );

      const result = await getToken();

      expect(result).toEqual({
        access_token: 'twitter-access-token',
        expires_at: expiresAt
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('logs the remaining lifetime in whole minutes', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(
        buildIntegration({ expires_at: NOW_SECONDS + 7259 })
      );

      await getToken();

      expect(console.info).toHaveBeenCalledWith(
        '[Twitter Token] Using existing token',
        {
          teamId: 'team-1',
          integrationId: 'integration-1',
          expiresIn: '120 minutes',
          expiresAt: '2026-01-01T02:00:59.000Z'
        }
      );
    });

    it('logs a lifetime of exactly two hours as 120 minutes', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(
        buildIntegration({ expires_at: NOW_SECONDS + 7200 })
      );

      await getToken();

      expect(console.info).toHaveBeenCalledWith(
        '[Twitter Token] Using existing token',
        expect.objectContaining({ expiresIn: '120 minutes' })
      );
    });

    it('truncates the current time to whole seconds when checking expiry', async () => {
      vi.setSystemTime(new Date(NOW.getTime() + 999));
      const expiresAt = NOW_SECONDS + EXPIRY_BUFFER_SECONDS + 1;
      prismaMock.integration.findFirst.mockResolvedValue(
        buildIntegration({ expires_at: expiresAt })
      );

      const result = await getToken();

      expect(result).toEqual({
        access_token: 'twitter-access-token',
        expires_at: expiresAt
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('when the stored token is expired', () => {
    it('refreshes a token that expires exactly at the buffer boundary', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(
        buildIntegration({ expires_at: NOW_SECONDS + EXPIRY_BUFFER_SECONDS })
      );
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-token', expires_in: 7200 })
      );

      const result = await getToken();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.access_token).toBe('new-token');
    });

    it('refreshes when the integration has no expiry and logs it as unknown', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(
        buildIntegration({ expires_at: null })
      );
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-token', expires_in: 7200 })
      );

      await getToken();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveBeenCalledWith(
        '[Twitter Token] Token expired, refreshing',
        {
          teamId: 'team-1',
          integrationId: 'integration-1',
          expiredAt: 'unknown',
          expiryBuffer: '300s'
        }
      );
    });

    it('logs the previous expiry time before refreshing', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(expiredIntegration());
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-token', expires_in: 7200 })
      );

      await getToken();

      expect(console.info).toHaveBeenCalledWith(
        '[Twitter Token] Token expired, refreshing',
        {
          teamId: 'team-1',
          integrationId: 'integration-1',
          expiredAt: '2025-12-31T23:59:00.000Z',
          expiryBuffer: '300s'
        }
      );
    });

    it('throws BAD_REQUEST without touching the integration when there is no refresh token', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(
        expiredIntegration({ refresh_token: null })
      );

      const error = await captureError(getToken());

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Token expired and no refresh token available'
      });
      expect(prismaMock.integration.update).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('posts a basic-auth form refresh request to the x.com token endpoint', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(expiredIntegration());
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-token', expires_in: 7200 })
      );

      await getToken();

      const { url, init } = fetchCall(fetchMock);
      expect(url).toBe('https://api.x.com/2/oauth2/token');
      expect(init.method).toBe('POST');
      expect(init.headers).toEqual({
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic dHdpdHRlci1jbGllbnQtaWQ6dHdpdHRlci1jbGllbnQtc2VjcmV0'
      });
      expect(formBody(init)).toEqual({
        grant_type: 'refresh_token',
        refresh_token: 'twitter-refresh-token-xyz'
      });
    });
  });

  describe('when twitter refreshes the token', () => {
    beforeEach(() => {
      prismaMock.integration.findFirst.mockResolvedValue(expiredIntegration());
    });

    it('stores the new tokens without changing the integration status', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 7200,
          scope: 'tweet.read users.read',
          token_type: 'bearer'
        })
      );

      await getToken();

      expect(prismaMock.integration.update).toHaveBeenCalledTimes(1);
      expect(prismaMock.integration.update).toHaveBeenCalledWith({
        where: { id: 'integration-1' },
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_at: NOW_SECONDS + 7200,
          scope: 'tweet.read users.read',
          token_type: 'bearer'
        }
      });
    });

    it('returns the new access token and absolute expiry', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-access-token', expires_in: 7200 })
      );

      const result = await getToken();

      expect(result).toEqual({
        access_token: 'new-access-token',
        expires_at: NOW_SECONDS + 7200
      });
    });

    it('keeps the existing refresh token when twitter does not return one', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-access-token', expires_in: 7200 })
      );

      await getToken();

      expect(prismaMock.integration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            refresh_token: 'twitter-refresh-token-xyz',
            scope: undefined,
            token_type: undefined
          })
        })
      );
    });

    it('keeps the existing refresh token when twitter returns an empty one', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          access_token: 'new-access-token',
          refresh_token: '',
          expires_in: 7200
        })
      );

      await getToken();

      expect(prismaMock.integration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            refresh_token: 'twitter-refresh-token-xyz'
          })
        })
      );
    });

    it('computes the new expiry from the current time truncated to whole seconds', async () => {
      vi.setSystemTime(new Date(NOW.getTime() + 999));
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-access-token', expires_in: 7200 })
      );

      const result = await getToken();

      expect(result.expires_at).toBe(NOW_SECONDS + 7200);
      expect(prismaMock.integration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ expires_at: NOW_SECONDS + 7200 })
        })
      );
    });

    it('rejects with the database error when storing the new tokens fails', async () => {
      const dbError = new Error('database unavailable');
      prismaMock.integration.update.mockRejectedValue(dbError);
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-access-token', expires_in: 7200 })
      );

      const error = await captureError(getToken());

      expect(error).toBe(dbError);
      expect(console.info).not.toHaveBeenCalledWith(
        '[Twitter Token] Token refreshed successfully',
        expect.anything()
      );
    });

    it('logs the new expiry after refreshing', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ access_token: 'new-access-token', expires_in: 7199 })
      );

      await getToken();

      expect(console.info).toHaveBeenCalledWith(
        '[Twitter Token] Token refreshed successfully',
        {
          teamId: 'team-1',
          integrationId: 'integration-1',
          newExpiresAt: '2026-01-01T01:59:59.000Z',
          expiresIn: '119 minutes'
        }
      );
    });
  });

  describe('when twitter rejects the refresh', () => {
    beforeEach(() => {
      prismaMock.integration.findFirst.mockResolvedValue(expiredIntegration());
    });

    it.each([400, 401, 500])(
      'marks the integration as ERROR for status %i',
      async (status) => {
        fetchMock.mockResolvedValue(
          jsonResponse({ error: 'invalid_request' }, { status })
        );

        await captureError(getToken());

        expect(prismaMock.integration.update).toHaveBeenCalledTimes(1);
        expect(prismaMock.integration.update).toHaveBeenCalledWith({
          where: { id: 'integration-1' },
          data: { status: 'ERROR' }
        });
      }
    );

    it.each([400, 401, 500])(
      'throws BAD_REQUEST with the twitter error details for status %i',
      async (status) => {
        fetchMock.mockResolvedValue(
          jsonResponse({ error: 'invalid_request' }, { status })
        );

        const error = await captureError(getToken());

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toMatchObject({
          code: 'BAD_REQUEST',
          message: 'Failed to refresh access token',
          cause: '{"error":"invalid_request"}',
          data: {
            twitterError: { error: 'invalid_request' },
            statusCode: status
          }
        });
      }
    );

    it('rejects with the database error when marking the integration as ERROR fails', async () => {
      const dbError = new Error('database unavailable');
      prismaMock.integration.update.mockRejectedValue(dbError);
      fetchMock.mockResolvedValue(
        jsonResponse({ error: 'invalid_request' }, { status: 401 })
      );

      const error = await captureError(getToken());

      expect(error).toBe(dbError);
    });

    it('logs the failure with a truncated refresh token preview', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ error: 'invalid_request' }, { status: 400 })
      );

      await captureError(getToken());

      expect(console.error).toHaveBeenCalledWith(
        'Twitter token refresh failed:',
        {
          status: 400,
          error: { error: 'invalid_request' },
          refreshTokenLength: 25,
          refreshTokenPreview: 'twitter-re...'
        }
      );
    });

    it('rejects with the JSON parse error when the error body is not JSON', async () => {
      fetchMock.mockResolvedValue(textResponse('Service Unavailable', 503));

      const error = await captureError(getToken());

      expect(error).toBeInstanceOf(SyntaxError);
      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });
  });

  describe('when the refresh request cannot be sent', () => {
    it('propagates the network error without updating the integration', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(expiredIntegration());
      fetchMock.mockRejectedValue(new TypeError('fetch failed'));

      const error = await captureError(getToken());

      expect(error).toBeInstanceOf(TypeError);
      expect(error).toMatchObject({ message: 'fetch failed' });
      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });
  });
});
