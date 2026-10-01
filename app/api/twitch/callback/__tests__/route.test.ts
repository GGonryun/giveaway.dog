import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { ZodError } from 'zod';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { ApplicationError } from '@/lib/errors';

const m = vi.hoisted(() => ({
  twitchOAuthCallback: vi.fn()
}));

vi.mock('@/lib/twitch/procedures/twitch-oauth-callback', () => ({
  twitchOAuthCallback: m.twitchOAuthCallback
}));

const BASE = 'http://localhost:3000';
const NOW = new Date('2026-01-15T12:00:00.000Z');
const INTEGRATIONS = `${BASE}/app/acme/settings/integrations`;

const request = (params: Record<string, string>) => {
  const url = new URL('/api/twitch/callback', BASE);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
};

const stateRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'state-1',
  value: {
    teamId: 'team-1',
    teamSlug: 'acme',
    features: ['CHAT_COMMANDS', 'CHANNEL_REDEMPTIONS']
  },
  expiresAt: new Date('2026-01-15T12:10:00.000Z'),
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides
});

const validParams = { code: 'auth-code', state: 'acme:state-1' };

describe('twitch callback GET', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    m.twitchOAuthCallback.mockReset();
    m.twitchOAuthCallback.mockResolvedValue({
      ok: true,
      data: { success: true, username: 'streamer' }
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

    it('does not query the database or call the procedure', async () => {
      await GET(request({ code: 'auth-code' }));

      expect(prismaMock.state.findUnique).not.toHaveBeenCalled();
      expect(m.twitchOAuthCallback).not.toHaveBeenCalled();
    });

    it('logs the missing state', async () => {
      await GET(request({ code: 'auth-code' }));

      expect(consoleError).toHaveBeenCalledWith(
        'Missing state parameter in Twitch callback'
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

    it('reports the expiry even when Twitch also sent an error', async () => {
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
      `${INTEGRATIONS}?success=twitch_connected&username=streamer`
    );
  });

  describe('when Twitch returns an error parameter', () => {
    it('redirects with the provider error code', async () => {
      const res = await GET(
        request({ ...validParams, error: 'access_denied' })
      );

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=access_denied`
      );
    });

    it('deletes the state record without calling the procedure', async () => {
      await GET(request({ ...validParams, error: 'access_denied' }));

      expect(prismaMock.state.delete).toHaveBeenCalledWith({
        where: { id: 'state-1' }
      });
      expect(m.twitchOAuthCallback).not.toHaveBeenCalled();
    });

    it('ignores an empty error parameter', async () => {
      const res = await GET(request({ ...validParams, error: '' }));

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?success=twitch_connected&username=streamer`
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
  });

  describe('when the stored state value is invalid', () => {
    it('redirects with parse_error when a required field is missing', async () => {
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
      expect(m.twitchOAuthCallback).not.toHaveBeenCalled();
    });

    it('redirects with parse_error when a feature is unknown', async () => {
      prismaMock.state.findUnique.mockResolvedValue(
        stateRecord({
          value: { teamId: 'team-1', teamSlug: 'acme', features: ['NOPE'] }
        })
      );

      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=parse_error`
      );
    });
  });

  describe('when the OAuth procedure returns a failure', () => {
    beforeEach(() => {
      m.twitchOAuthCallback.mockResolvedValue({
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

      expect(prismaMock.state.delete).toHaveBeenCalledTimes(1);
      expect(prismaMock.state.delete).toHaveBeenCalledWith({
        where: { id: 'state-1' }
      });
    });
  });

  describe('when the OAuth procedure returns an unexpected payload', () => {
    it('redirects with internal_server_error and keeps the state', async () => {
      m.twitchOAuthCallback.mockResolvedValue({
        ok: true,
        data: { success: true, username: 42 }
      });

      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=internal_server_error`
      );
      expect(prismaMock.state.delete).not.toHaveBeenCalled();
    });
  });

  describe('when an unexpected error is thrown', () => {
    it('redirects with internal_server_error when the procedure throws', async () => {
      m.twitchOAuthCallback.mockRejectedValue(new Error('network down'));

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
        'Twitch OAuth callback error:',
        failure
      );
    });
  });

  describe('when a failure is handled', () => {
    const loggedError = () =>
      consoleError.mock.calls.find(
        ([label]: unknown[]) => label === 'Twitch OAuth callback error:'
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
        scenario: 'Twitch returns an error parameter',
        arrange: () => undefined,
        params: { ...validParams, error: 'access_denied' },
        expected: {
          code: 'BAD_REQUEST',
          message: 'Twitch OAuth error',
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
          m.twitchOAuthCallback.mockResolvedValue({
            ok: false,
            data: { code: 'BAD_REQUEST', message: 'Token exchange failed' }
          }),
        params: validParams,
        expected: {
          code: 'BAD_REQUEST',
          message: 'Twitch OAuth callback failed',
          data: 'oauth_failed'
        }
      },
      {
        scenario: 'the OAuth procedure returns an unexpected payload',
        arrange: () =>
          m.twitchOAuthCallback.mockResolvedValue({
            ok: true,
            data: { success: false, username: 'streamer' }
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

  describe('when deleting the state record fails on an error path', () => {
    beforeEach(() => {
      prismaMock.state.findUnique.mockResolvedValue(
        stateRecord({ expiresAt: null })
      );
      prismaMock.state.delete.mockRejectedValue(knownRequestError('P2025'));
    });

    it('still redirects with the original error code', async () => {
      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=invalid_state`
      );
    });

    it('logs the delete failure without the error', async () => {
      await GET(request(validParams));

      expect(consoleError).toHaveBeenCalledWith('Failed to delete state');
    });
  });

  describe('when the callback succeeds', () => {
    it('passes the code and the parsed state to the OAuth procedure', async () => {
      await GET(request(validParams));

      expect(m.twitchOAuthCallback).toHaveBeenCalledWith({
        code: 'auth-code',
        state: {
          teamId: 'team-1',
          teamSlug: 'acme',
          features: ['CHAT_COMMANDS', 'CHANNEL_REDEMPTIONS']
        }
      });
    });

    it('defaults the features to chat commands when the state omits them', async () => {
      prismaMock.state.findUnique.mockResolvedValue(
        stateRecord({ value: { teamId: 'team-1', teamSlug: 'acme' } })
      );

      await GET(request(validParams));

      expect(m.twitchOAuthCallback).toHaveBeenCalledWith({
        code: 'auth-code',
        state: {
          teamId: 'team-1',
          teamSlug: 'acme',
          features: ['CHAT_COMMANDS']
        }
      });
    });

    it('deletes the state record', async () => {
      await GET(request(validParams));

      expect(prismaMock.state.delete).toHaveBeenCalledWith({
        where: { id: 'state-1' }
      });
    });

    it('redirects to the integrations page with the connected username', async () => {
      const res = await GET(request(validParams));

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?success=twitch_connected&username=streamer`
      );
    });

    it('uses the slug from the state parameter rather than the stored team slug', async () => {
      const res = await GET(
        request({ code: 'auth-code', state: 'other-team:state-1' })
      );

      expect(res.headers.get('location')).toBe(
        `${BASE}/app/other-team/settings/integrations?success=twitch_connected&username=streamer`
      );
    });

    it('redirects with internal_server_error when deleting the state fails', async () => {
      prismaMock.state.delete.mockRejectedValue(knownRequestError('P2025'));

      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?error=internal_server_error`
      );
    });
  });
});
