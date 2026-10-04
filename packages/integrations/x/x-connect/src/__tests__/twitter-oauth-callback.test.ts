import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IntegrationProvider } from '@giveaway/db-model';
import { twitterOAuthCallback } from '../twitter-oauth-callback';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';

vi.hoisted(() => {
  vi.stubEnv('TWITTER_TEAM_APP_CLIENT_ID', 'client-id');
  vi.stubEnv('TWITTER_TEAM_APP_CLIENT_SECRET', 'client-secret');
  vi.stubEnv('NEXTAUTH_URL', 'https://giveaway.test');
});

const NOW = new Date('2026-01-01T00:00:00.000Z');
const NOW_SECONDS = Math.floor(NOW.getTime() / 1000);

const input = {
  code: 'auth-code',
  state: { teamId: 'team-1', codeVerifier: 'verifier-123' }
};

const tokens = {
  access_token: 'access-abc',
  refresh_token: 'refresh-def',
  expires_in: 7200,
  scope: 'tweet.read users.read offline.access',
  token_type: 'bearer'
};

const me = { data: { id: 'tw-42', username: 'acme_dog', name: 'Acme' } };

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init
  });

const fetchMock = vi.fn<typeof fetch>();

const requestAt = (index: number) => {
  const [url, init] = fetchMock.mock.calls[index];
  return { url, init: init as RequestInit };
};

const loadWithEnv = async (env: Record<string, string | undefined>) => {
  vi.resetModules();
  for (const [name, value] of Object.entries(env)) {
    vi.stubEnv(name, value);
  }
  const mod = await import('../twitter-oauth-callback');
  return mod.twitterOAuthCallback;
};

describe('twitterOAuthCallback', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without contacting X', async () => {
      const result = await twitterOAuthCallback(input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects a missing code', async () => {
      const result = await twitterOAuthCallback({
        state: input.state
      } as unknown as Parameters<typeof twitterOAuthCallback>[0]);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects a state without a code verifier', async () => {
      const result = await twitterOAuthCallback({
        code: 'auth-code',
        state: { teamId: 'team-1' }
      } as unknown as Parameters<typeof twitterOAuthCallback>[0]);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('when twitter credentials are not configured', () => {
    beforeEach(() => {
      signIn();
    });

    it('returns INTERNAL_SERVER_ERROR when the client id is missing', async () => {
      const callback = await loadWithEnv({
        TWITTER_TEAM_APP_CLIENT_ID: '',
        TWITTER_TEAM_APP_CLIENT_SECRET: 'client-secret'
      });

      const result = await callback(input);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Twitter OAuth not configured'
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns INTERNAL_SERVER_ERROR when the client secret is missing', async () => {
      const callback = await loadWithEnv({
        TWITTER_TEAM_APP_CLIENT_ID: 'client-id',
        TWITTER_TEAM_APP_CLIENT_SECRET: undefined
      });

      const result = await callback(input);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Twitter OAuth not configured'
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('when exchanging the authorization code', () => {
    beforeEach(() => {
      signIn();
    });

    it('posts the code, verifier and redirect uri to the X token endpoint', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response('nope', { status: 400, statusText: 'Bad Request' })
      );

      await twitterOAuthCallback(input);

      const { url, init } = requestAt(0);
      expect(url).toBe('https://api.x.com/2/oauth2/token');
      expect(init.method).toBe('POST');
      expect(Object.fromEntries(init.body as URLSearchParams)).toEqual({
        code: 'auth-code',
        grant_type: 'authorization_code',
        redirect_uri: 'https://giveaway.test/api/auth/twitter-callback',
        code_verifier: 'verifier-123'
      });
    });

    it('authenticates the token request with basic client credentials', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response('nope', { status: 400, statusText: 'Bad Request' })
      );

      await twitterOAuthCallback(input);

      expect(requestAt(0).init.headers).toEqual({
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from('client-id:client-secret').toString('base64')}`
      });
    });

    it('returns BAD_REQUEST with the response body when the exchange fails', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response('{"error":"invalid_grant"}', {
          status: 400,
          statusText: 'Bad Request'
        })
      );

      const result = await twitterOAuthCallback(input);

      const failure = expectFailure(result, 'BAD_REQUEST');
      expect(failure.message).toBe(
        'Failed to exchange code for tokens: 400 Bad Request'
      );
      expect(failure.data).toBe('{"error":"invalid_grant"}');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
    });

    it('logs the body of a failed exchange', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      fetchMock.mockResolvedValueOnce(
        new Response('{"error":"invalid_grant"}', {
          status: 400,
          statusText: 'Bad Request'
        })
      );

      await twitterOAuthCallback(input);

      expect(consoleError).toHaveBeenCalledWith(
        'Twitter token exchange failed:',
        '{"error":"invalid_grant"}'
      );
    });
  });

  describe('when fetching the X account', () => {
    beforeEach(() => {
      signIn();
      fetchMock.mockResolvedValueOnce(jsonResponse(tokens));
    });

    it('requests the authenticated user with the new access token', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(me));
      prismaMock.integration.findFirst.mockResolvedValue(null);

      await twitterOAuthCallback(input);

      expect(requestAt(1)).toEqual({
        url: 'https://api.x.com/2/users/me',
        init: { headers: { Authorization: 'Bearer access-abc' } }
      });
    });

    it('returns BAD_REQUEST with the response body when the user lookup fails', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response('expired', { status: 401, statusText: 'Unauthorized' })
      );

      const result = await twitterOAuthCallback(input);

      const failure = expectFailure(result, 'BAD_REQUEST');
      expect(failure.message).toBe(
        'Failed to fetch Twitter user info: 401 Unauthorized'
      );
      expect(failure.data).toBe('expired');
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.integration.create).not.toHaveBeenCalled();
    });

    it('logs the body of a failed user lookup', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      fetchMock.mockResolvedValueOnce(
        new Response('expired', { status: 401, statusText: 'Unauthorized' })
      );

      await twitterOAuthCallback(input);

      expect(consoleError).toHaveBeenCalledWith(
        'Twitter user fetch failed:',
        'expired'
      );
    });

    it('returns INTERNAL_SERVER_ERROR when the user payload has no data', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({}));

      const result = await twitterOAuthCallback(input);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toMatch(
        /reading 'id'/
      );
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('when the account is fetched successfully', () => {
    beforeEach(() => {
      signIn();
      fetchMock
        .mockResolvedValueOnce(jsonResponse(tokens))
        .mockResolvedValueOnce(jsonResponse(me));
    });

    it('looks for an existing twitter integration for the team and account', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      await twitterOAuthCallback(input);

      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: {
          teamId: 'team-1',
          provider: IntegrationProvider.TWITTER,
          account_id: 'tw-42'
        }
      });
    });

    it('creates a new integration owned by the caller when none exists', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      await twitterOAuthCallback(input);

      expect(prismaMock.integration.create).toHaveBeenCalledWith({
        data: {
          teamId: 'team-1',
          ownerId: TEST_USER.id,
          provider: IntegrationProvider.TWITTER,
          account_id: 'tw-42',
          access_token: 'access-abc',
          refresh_token: 'refresh-def',
          expires_at: NOW_SECONDS + 7200,
          scope: 'tweet.read users.read offline.access',
          token_type: 'bearer',
          label: 'acme_dog'
        }
      });
      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });

    it('updates the tokens and label of an existing integration', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({ id: 'int-9' });

      await twitterOAuthCallback(input);

      expect(prismaMock.integration.update).toHaveBeenCalledWith({
        where: { id: 'int-9' },
        data: {
          access_token: 'access-abc',
          refresh_token: 'refresh-def',
          expires_at: NOW_SECONDS + 7200,
          scope: 'tweet.read users.read offline.access',
          token_type: 'bearer',
          label: 'acme_dog'
        }
      });
      expect(prismaMock.integration.create).not.toHaveBeenCalled();
    });

    it('returns success with the X username after creating', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      const result = await twitterOAuthCallback(input);

      expect(expectOk(result)).toEqual({ success: true, username: 'acme_dog' });
    });

    it('returns success with the X username after updating', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({ id: 'int-9' });

      const result = await twitterOAuthCallback(input);

      expect(expectOk(result)).toEqual({ success: true, username: 'acme_dog' });
    });

    it('does not verify that the caller belongs to the team in the state', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      const result = await twitterOAuthCallback({
        ...input,
        state: { teamId: 'someone-elses-team', codeVerifier: 'v' }
      });

      expectOk(result);
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.membership.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.integration.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ teamId: 'someone-elses-team' })
      });
    });

    it('maps a unique constraint error on create to INTERNAL_SERVER_ERROR', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);
      prismaMock.integration.create.mockRejectedValue(
        knownRequestError('P2002')
      );

      const result = await twitterOAuthCallback(input);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toMatch(
        /^We f\*\*\*\*d up\. Try again or contact giveaway\.dog support staff/
      );
    });
  });

  describe('when the clock is part way through a second', () => {
    beforeEach(() => {
      signIn();
      vi.setSystemTime(new Date('2026-01-01T00:00:00.900Z'));
      fetchMock
        .mockResolvedValueOnce(jsonResponse(tokens))
        .mockResolvedValueOnce(jsonResponse(me));
    });

    it('rounds the current time down when creating the expiry', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      await twitterOAuthCallback(input);

      expect(prismaMock.integration.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ expires_at: NOW_SECONDS + 7200 })
      });
    });

    it('rounds the current time down when updating the expiry', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({ id: 'int-9' });

      await twitterOAuthCallback(input);

      expect(prismaMock.integration.update).toHaveBeenCalledWith({
        where: { id: 'int-9' },
        data: expect.objectContaining({ expires_at: NOW_SECONDS + 7200 })
      });
    });
  });

  describe('when the token response omits expires_in', () => {
    it('stores NaN as the expiry', async () => {
      signIn();
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse({ ...tokens, expires_in: undefined })
        )
        .mockResolvedValueOnce(jsonResponse(me));
      prismaMock.integration.findFirst.mockResolvedValue(null);

      await twitterOAuthCallback(input);

      expect(prismaMock.integration.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ expires_at: NaN })
      });
    });
  });
});
