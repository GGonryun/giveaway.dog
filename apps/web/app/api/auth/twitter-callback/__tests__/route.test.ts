import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { ZodError } from 'zod';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import { ApplicationError } from '@giveaway/util-errors';

const m = vi.hoisted(() => ({
  twitterOAuthCallback: vi.fn()
}));

vi.mock('@/lib/integrations/procedures/twitter-oauth-callback', () => ({
  twitterOAuthCallback: m.twitterOAuthCallback
}));

const BASE = 'http://localhost:3000';
const NOW = new Date('2026-01-15T12:00:00.000Z');
const INTEGRATIONS = `${BASE}/app/acme/settings/integrations`;

const request = (params: Record<string, string>) => {
  const url = new URL('/api/auth/twitter-callback', BASE);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
};

const stateRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'state-1',
  value: { teamId: 'team-1', codeVerifier: 'verifier-1' },
  expiresAt: new Date('2026-01-15T12:10:00.000Z'),
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides
});

const validParams = { code: 'auth-code', state: 'acme:state-1' };

describe('twitter-callback GET', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    m.twitterOAuthCallback.mockReset();
    m.twitterOAuthCallback.mockResolvedValue({
      ok: true,
      data: { success: true, username: 'jack' }
    });
    prismaMock.state.findUnique.mockResolvedValue(stateRecord());
    prismaMock.state.delete.mockResolvedValue(stateRecord());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('when the state parameter is missing', () => {
    it('redirects to the 404 page', async () => {
      const res = await GET(request({ code: 'auth-code' }));

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe(`${BASE}/404`);
    });

    it('does not query the database', async () => {
      await GET(request({ code: 'auth-code' }));

      expect(prismaMock.state.findUnique).not.toHaveBeenCalled();
      expect(m.twitterOAuthCallback).not.toHaveBeenCalled();
    });

    it('logs the missing state', async () => {
      await GET(request({ code: 'auth-code' }));

      expect(consoleError).toHaveBeenCalledWith(
        'Missing state parameter in Twitter callback'
      );
    });

    it('treats an empty state parameter as missing', async () => {
      const res = await GET(request({ code: 'auth-code', state: '' }));

      expect(res.headers.get('location')).toBe(`${BASE}/404`);
    });
  });

  describe('when the state parameter is parsed', () => {
    it('looks up the state record by the segment after the colon', async () => {
      await GET(request(validParams));

      expect(prismaMock.state.findUnique).toHaveBeenCalledWith({
        where: { id: 'state-1' }
      });
    });

    it('ignores segments after a second colon', async () => {
      await GET(request({ code: 'auth-code', state: 'acme:state-1:extra' }));

      expect(prismaMock.state.findUnique).toHaveBeenCalledWith({
        where: { id: 'state-1' }
      });
    });

    it('queries an undefined id when the state has no colon', async () => {
      prismaMock.state.findUnique.mockResolvedValue(null);

      const res = await GET(request({ code: 'auth-code', state: 'acme' }));

      expect(prismaMock.state.findUnique).toHaveBeenCalledWith({
        where: { id: undefined }
      });
      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=internal_server_error`
      );
    });
  });

  describe('when the state record does not exist', () => {
    beforeEach(() => {
      prismaMock.state.findUnique.mockResolvedValue(null);
    });

    it('redirects with internal_server_error', async () => {
      const res = await GET(request(validParams));

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=internal_server_error`
      );
    });

    it('does not try to delete the state', async () => {
      await GET(request(validParams));

      expect(prismaMock.state.delete).not.toHaveBeenCalled();
    });
  });

  describe('when the state record has no expiration', () => {
    beforeEach(() => {
      prismaMock.state.findUnique.mockResolvedValue(
        stateRecord({ expiresAt: null })
      );
    });

    it('redirects with invalid_state', async () => {
      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=invalid_state`
      );
    });

    it('deletes the state record', async () => {
      await GET(request(validParams));

      expect(prismaMock.state.delete).toHaveBeenCalledWith({
        where: { id: 'state-1' }
      });
    });
  });

  describe('when the state record has expired', () => {
    beforeEach(() => {
      prismaMock.state.findUnique.mockResolvedValue(
        stateRecord({ expiresAt: new Date(NOW.getTime() - 1) })
      );
    });

    it('redirects with expired_state', async () => {
      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=expired_state`
      );
    });

    it('deletes the state record', async () => {
      await GET(request(validParams));

      expect(prismaMock.state.delete).toHaveBeenCalledWith({
        where: { id: 'state-1' }
      });
    });

    it('reports the expiry even when Twitter also sent an error', async () => {
      const res = await GET(
        request({ ...validParams, error: 'access_denied' })
      );

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=expired_state`
      );
    });
  });

  it('accepts a state that expires exactly now', async () => {
    prismaMock.state.findUnique.mockResolvedValue(
      stateRecord({ expiresAt: new Date(NOW) })
    );

    const res = await GET(request(validParams));

    expect(res.headers.get('location')).toBe(
      `${INTEGRATIONS}?success=twitter_connected&username=jack`
    );
  });

  describe('when Twitter returns an error parameter', () => {
    it('redirects with the provider error code', async () => {
      const res = await GET(
        request({ ...validParams, error: 'access_denied' })
      );

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=access_denied`
      );
    });

    it('deletes the state record', async () => {
      await GET(request({ ...validParams, error: 'access_denied' }));

      expect(prismaMock.state.delete).toHaveBeenCalledWith({
        where: { id: 'state-1' }
      });
    });

    it('does not call the OAuth procedure', async () => {
      await GET(request({ ...validParams, error: 'access_denied' }));

      expect(m.twitterOAuthCallback).not.toHaveBeenCalled();
    });

    it('encodes the provider error in the redirect query', async () => {
      const res = await GET(
        request({ ...validParams, error: 'bad request&x' })
      );

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=bad+request%26x`
      );
    });

    it('ignores an empty error parameter', async () => {
      const res = await GET(request({ ...validParams, error: '' }));

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?success=twitter_connected&username=jack`
      );
    });
  });

  describe('when the code parameter is missing', () => {
    it('redirects with missing_code and deletes the state', async () => {
      const res = await GET(request({ state: 'acme:state-1' }));

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=missing_code`
      );
      expect(prismaMock.state.delete).toHaveBeenCalledWith({
        where: { id: 'state-1' }
      });
    });

    it('treats an empty code as missing', async () => {
      const res = await GET(request({ code: '', state: 'acme:state-1' }));

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=missing_code`
      );
    });
  });

  describe('when the stored state value is invalid', () => {
    it('redirects with parse_error and deletes the state', async () => {
      prismaMock.state.findUnique.mockResolvedValue(
        stateRecord({ value: { teamId: 'team-1' } })
      );

      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=parse_error`
      );
      expect(prismaMock.state.delete).toHaveBeenCalledWith({
        where: { id: 'state-1' }
      });
      expect(m.twitterOAuthCallback).not.toHaveBeenCalled();
    });

    it('rejects a null state value', async () => {
      prismaMock.state.findUnique.mockResolvedValue(
        stateRecord({ value: null })
      );

      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=parse_error`
      );
    });
  });

  describe('when the OAuth procedure returns a failure', () => {
    beforeEach(() => {
      m.twitterOAuthCallback.mockResolvedValue({
        ok: false,
        data: { code: 'BAD_REQUEST', message: 'Token exchange failed' }
      });
    });

    it('redirects with oauth_failed', async () => {
      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=oauth_failed`
      );
    });

    it('deletes the state record', async () => {
      await GET(request(validParams));

      expect(prismaMock.state.delete).toHaveBeenCalledWith({
        where: { id: 'state-1' }
      });
    });
  });

  describe('when the OAuth procedure returns an unexpected payload', () => {
    it('redirects with internal_server_error when the username is missing', async () => {
      m.twitterOAuthCallback.mockResolvedValue({
        ok: true,
        data: { success: true }
      });

      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=internal_server_error`
      );
      expect(prismaMock.state.delete).not.toHaveBeenCalled();
    });

    it('redirects with internal_server_error when success is not true', async () => {
      m.twitterOAuthCallback.mockResolvedValue({
        ok: true,
        data: { success: false, username: 'jack' }
      });

      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=internal_server_error`
      );
    });
  });

  describe('when an unexpected error is thrown', () => {
    it('redirects with internal_server_error when the procedure throws', async () => {
      m.twitterOAuthCallback.mockRejectedValue(new Error('network down'));

      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=internal_server_error`
      );
      expect(prismaMock.state.delete).not.toHaveBeenCalled();
    });

    it('redirects with internal_server_error when the state lookup throws', async () => {
      prismaMock.state.findUnique.mockRejectedValue(new Error('db down'));

      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=internal_server_error`
      );
    });

    it('logs the caught error', async () => {
      const failure = new Error('db down');
      prismaMock.state.findUnique.mockRejectedValue(failure);

      await GET(request(validParams));

      expect(consoleError).toHaveBeenCalledWith(
        'Twitter OAuth callback error:',
        failure
      );
    });
  });

  describe('when a failure is handled', () => {
    const loggedError = () =>
      consoleError.mock.calls.find(
        ([label]: unknown[]) => label === 'Twitter OAuth callback error:'
      )?.[1];

    it.each([
      {
        scenario: 'the state record does not exist',
        arrange: () => prismaMock.state.findUnique.mockResolvedValue(null),
        params: validParams,
        expected: {
          code: 'NOT_FOUND',
          message: 'State not found',
          data: 'invalid_state'
        }
      },
      {
        scenario: 'the state record has no expiration',
        arrange: () =>
          prismaMock.state.findUnique.mockResolvedValue(
            stateRecord({ expiresAt: null })
          ),
        params: validParams,
        expected: {
          code: 'BAD_REQUEST',
          message: 'State has no expiration',
          data: 'invalid_state'
        }
      },
      {
        scenario: 'the state record has expired',
        arrange: () =>
          prismaMock.state.findUnique.mockResolvedValue(
            stateRecord({ expiresAt: new Date(NOW.getTime() - 1) })
          ),
        params: validParams,
        expected: {
          code: 'BAD_REQUEST',
          message: 'State has expired',
          data: 'expired_state'
        }
      },
      {
        scenario: 'Twitter returns an error parameter',
        arrange: () => undefined,
        params: { ...validParams, error: 'access_denied' },
        expected: {
          code: 'BAD_REQUEST',
          message: 'Twitter OAuth error',
          data: 'access_denied'
        }
      },
      {
        scenario: 'the code parameter is missing',
        arrange: () => undefined,
        params: { state: 'acme:state-1' },
        expected: {
          code: 'BAD_REQUEST',
          message: 'Missing code or state',
          data: 'missing_code'
        }
      },
      {
        scenario: 'the stored state value is invalid',
        arrange: () =>
          prismaMock.state.findUnique.mockResolvedValue(
            stateRecord({ value: { teamId: 'team-1' } })
          ),
        params: validParams,
        expected: {
          code: 'BAD_REQUEST',
          message: 'Failed to parse state',
          data: 'parse_error',
          cause: expect.any(ZodError)
        }
      },
      {
        scenario: 'the OAuth procedure returns a failure',
        arrange: () =>
          m.twitterOAuthCallback.mockResolvedValue({
            ok: false,
            data: { code: 'BAD_REQUEST', message: 'Token exchange failed' }
          }),
        params: validParams,
        expected: {
          code: 'BAD_REQUEST',
          message: 'Twitter OAuth callback failed',
          data: 'oauth_failed'
        }
      },
      {
        scenario: 'the OAuth procedure returns an unexpected payload',
        arrange: () =>
          m.twitterOAuthCallback.mockResolvedValue({
            ok: true,
            data: { success: true }
          }),
        params: validParams,
        expected: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid callback result format',
          data: 'validation_error',
          cause: expect.any(ZodError)
        }
      }
    ])(
      'logs the application error when $scenario',
      async ({ arrange, params, expected }) => {
        arrange();

        await GET(request(params));

        const logged = loggedError();
        expect(logged).toBeInstanceOf(ApplicationError);
        expect(logged).toMatchObject(expected);
      }
    );
  });

  describe('when deleting the state record fails', () => {
    const deleteError = knownRequestError('P2025');

    beforeEach(() => {
      prismaMock.state.findUnique.mockResolvedValue(
        stateRecord({ expiresAt: null })
      );
      prismaMock.state.delete.mockRejectedValue(deleteError);
    });

    it('still redirects with the original error code', async () => {
      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=invalid_state`
      );
    });

    it('logs the delete failure with the error', async () => {
      await GET(request(validParams));

      expect(consoleError).toHaveBeenCalledWith(
        'Failed to delete state:',
        deleteError
      );
    });
  });

  describe('when the callback succeeds', () => {
    it('passes the code and the parsed state to the OAuth procedure', async () => {
      await GET(request(validParams));

      expect(m.twitterOAuthCallback).toHaveBeenCalledWith({
        code: 'auth-code',
        state: { teamId: 'team-1', codeVerifier: 'verifier-1' }
      });
    });

    it('strips unknown keys from the stored state before calling the procedure', async () => {
      prismaMock.state.findUnique.mockResolvedValue(
        stateRecord({
          value: { teamId: 'team-1', codeVerifier: 'verifier-1', extra: 'x' }
        })
      );

      await GET(request(validParams));

      expect(m.twitterOAuthCallback).toHaveBeenCalledWith({
        code: 'auth-code',
        state: { teamId: 'team-1', codeVerifier: 'verifier-1' }
      });
    });

    it('redirects to the integrations page with the connected username', async () => {
      const res = await GET(request(validParams));

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?success=twitter_connected&username=jack`
      );
    });

    it('uses the slug from the state parameter in the redirect', async () => {
      const res = await GET(
        request({ code: 'auth-code', state: 'other-team:state-1' })
      );

      expect(res.headers.get('location')).toBe(
        `${BASE}/app/other-team/settings/integrations?success=twitter_connected&username=jack`
      );
    });

    it('leaves the state record in the database', async () => {
      await GET(request(validParams));

      expect(prismaMock.state.delete).not.toHaveBeenCalled();
    });

    it('interpolates the username into the redirect without encoding it', async () => {
      m.twitterOAuthCallback.mockResolvedValue({
        ok: true,
        data: { success: true, username: 'a&b=c' }
      });

      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?success=twitter_connected&username=a&b=c`
      );
    });
  });
});
