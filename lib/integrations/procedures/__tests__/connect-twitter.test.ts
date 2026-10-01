import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHash } from 'node:crypto';
import { TeamRole, TeamTier } from '@prisma/client';
import { connectTwitter } from '../connect-twitter';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

vi.hoisted(() => {
  vi.stubEnv('TWITTER_TEAM_APP_CLIENT_ID', 'client-id');
  vi.stubEnv('NEXTAUTH_URL', 'https://giveaway.test');
});

const NOW = new Date('2026-01-01T00:00:00.000Z');

const team = (
  overrides: {
    tier?: TeamTier;
    members?: { userId: string; role: TeamRole }[];
  } = {}
) => ({
  id: 'team-1',
  slug: 'acme',
  tier: overrides.tier ?? TeamTier.FREE,
  members: overrides.members ?? [
    { id: 'm-1', userId: TEST_USER.id, role: TeamRole.ADMIN }
  ]
});

const authParams = (authUrl: string) => {
  const url = new URL(authUrl);
  return { url, params: url.searchParams };
};

const createdStateValue = () => {
  const call = prismaMock.state.create.mock.calls[0][0] as {
    data: { value: { teamId: string; codeVerifier: string } };
  };
  return call.data.value;
};

const loadWithEnv = async (env: Record<string, string | undefined>) => {
  vi.resetModules();
  for (const [name, value] of Object.entries(env)) {
    vi.stubEnv(name, value);
  }
  const mod = await import('../connect-twitter');
  return mod.connectTwitter;
};

describe('connectTwitter', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without looking up the team', async () => {
      const result = await connectTwitter({
        slug: 'acme',
        features: ['GET_PROFILE']
      });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects an empty features array', async () => {
      const result = await connectTwitter({ slug: 'acme', features: [] });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });

    it('rejects an unknown feature', async () => {
      const result = await connectTwitter({
        slug: 'acme',
        features: ['DELETE_TWEETS']
      } as unknown as Parameters<typeof connectTwitter>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });

    it('rejects a missing slug', async () => {
      const result = await connectTwitter({
        features: ['GET_PROFILE']
      } as unknown as Parameters<typeof connectTwitter>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });
  });

  describe('when the team cannot be used', () => {
    beforeEach(() => {
      signIn();
    });

    it('looks up the team by slug scoped to the caller membership', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      await connectTwitter({ slug: 'acme', features: ['GET_PROFILE'] });

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
        where: { slug: 'acme', members: { some: { userId: TEST_USER.id } } },
        include: { members: true }
      });
    });

    it('returns NOT_FOUND when the team does not exist for the caller', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      const result = await connectTwitter({
        slug: 'acme',
        features: ['GET_PROFILE']
      });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.state.create).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN when the caller has no membership row', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        team({ members: [{ userId: 'someone-else', role: TeamRole.OWNER }] })
      );

      const result = await connectTwitter({
        slug: 'acme',
        features: ['GET_PROFILE']
      });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You are not a member of this team'
      );
      expect(prismaMock.state.create).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN when the caller role cannot update integrations', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        team({ members: [{ userId: TEST_USER.id, role: TeamRole.GUEST }] })
      );

      const result = await connectTwitter({
        slug: 'acme',
        features: ['GET_PROFILE']
      });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You do not have permission to perform this action. Required permission: UPDATE_INTEGRATIONS'
      );
      expect(prismaMock.state.create).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN when the team tier is not recognised', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        team({ tier: 'LEGACY' as TeamTier })
      );

      const result = await connectTwitter({
        slug: 'acme',
        features: ['GET_PROFILE']
      });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'This feature requires a team with at least the FREE tier.'
      );
    });
  });

  describe('when the caller may update integrations', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team());
      prismaMock.state.create.mockResolvedValue({ id: 'state-1' });
    });

    it('allows a regular member to start the flow', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        team({ members: [{ userId: TEST_USER.id, role: TeamRole.MEMBER }] })
      );

      const result = await connectTwitter({
        slug: 'acme',
        features: ['GET_PROFILE']
      });

      expect(expectOk(result).authUrl).toMatch(
        /^https:\/\/x\.com\/i\/oauth2\/authorize\?/
      );
    });

    it('stores the team id and code verifier in a state row that expires in ten minutes', async () => {
      await connectTwitter({ slug: 'acme', features: ['GET_PROFILE'] });

      expect(prismaMock.state.create).toHaveBeenCalledWith({
        data: {
          value: { teamId: 'team-1', codeVerifier: expect.any(String) },
          expiresAt: new Date('2026-01-01T00:10:00.000Z')
        },
        select: { id: true }
      });
    });

    it('generates a 43 character base64url code verifier', async () => {
      await connectTwitter({ slug: 'acme', features: ['GET_PROFILE'] });

      expect(createdStateValue().codeVerifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    });

    it('generates a fresh code verifier on every call', async () => {
      await connectTwitter({ slug: 'acme', features: ['GET_PROFILE'] });
      await connectTwitter({ slug: 'acme', features: ['GET_PROFILE'] });

      const calls = prismaMock.state.create.mock.calls as [
        { data: { value: { codeVerifier: string } } }
      ][];
      expect(calls[0][0].data.value.codeVerifier).not.toBe(
        calls[1][0].data.value.codeVerifier
      );
    });

    it('returns the X authorize url with the oauth parameters', async () => {
      const result = await connectTwitter({
        slug: 'acme',
        features: ['GET_PROFILE']
      });

      const { url, params } = authParams(expectOk(result).authUrl);
      expect(`${url.origin}${url.pathname}`).toBe(
        'https://x.com/i/oauth2/authorize'
      );
      expect(params.get('response_type')).toBe('code');
      expect(params.get('client_id')).toBe('client-id');
      expect(params.get('redirect_uri')).toBe(
        'https://giveaway.test/api/auth/twitter-callback'
      );
      expect(params.get('state')).toBe('acme:state-1');
      expect(params.get('code_challenge_method')).toBe('S256');
    });

    it('orders the url parameters as built', async () => {
      const result = await connectTwitter({
        slug: 'acme',
        features: ['GET_PROFILE']
      });

      const { params } = authParams(expectOk(result).authUrl);
      expect([...params.keys()]).toEqual([
        'response_type',
        'client_id',
        'redirect_uri',
        'scope',
        'state',
        'code_challenge',
        'code_challenge_method'
      ]);
    });

    it('derives the code challenge as the base64url sha256 of the stored verifier', async () => {
      const result = await connectTwitter({
        slug: 'acme',
        features: ['GET_PROFILE']
      });

      const { params } = authParams(expectOk(result).authUrl);
      const expected = createHash('sha256')
        .update(createdStateValue().codeVerifier)
        .digest('base64url');
      expect(params.get('code_challenge')).toBe(expected);
    });

    it('requests only the profile scopes for the GET_PROFILE feature', async () => {
      const result = await connectTwitter({
        slug: 'acme',
        features: ['GET_PROFILE']
      });

      const { params } = authParams(expectOk(result).authUrl);
      expect(params.get('scope')).toBe('tweet.read users.read offline.access');
    });

    it('always prepends the profile scopes to the requested features', async () => {
      const result = await connectTwitter({
        slug: 'acme',
        features: ['IMPORT_TASKS', 'POST_TWEETS']
      });

      const { params } = authParams(expectOk(result).authUrl);
      expect(params.get('scope')).toBe(
        'tweet.read users.read offline.access follows.read like.read tweet.write media.write'
      );
    });

    it('deduplicates scopes when a feature is repeated', async () => {
      const result = await connectTwitter({
        slug: 'acme',
        features: ['POST_TWEETS', 'GET_PROFILE', 'POST_TWEETS']
      });

      const { params } = authParams(expectOk(result).authUrl);
      expect(params.get('scope')).toBe(
        'tweet.read users.read offline.access tweet.write media.write'
      );
    });

    it('encodes the scope with plus-separated words in the raw url', async () => {
      const result = await connectTwitter({
        slug: 'acme',
        features: ['GET_PROFILE']
      });

      expect(expectOk(result).authUrl).toContain(
        'scope=tweet.read+users.read+offline.access'
      );
    });

    it('uses the team slug from the database in the state parameter', async () => {
      prismaMock.team.findUnique.mockResolvedValue({
        ...team(),
        slug: 'db-slug'
      });

      const result = await connectTwitter({
        slug: 'acme',
        features: ['GET_PROFILE']
      });

      const { params } = authParams(expectOk(result).authUrl);
      expect(params.get('state')).toBe('db-slug:state-1');
    });

    it('maps a prisma error while creating the state to INTERNAL_SERVER_ERROR', async () => {
      prismaMock.state.create.mockRejectedValue(knownRequestError('P2002'));

      const result = await connectTwitter({
        slug: 'acme',
        features: ['GET_PROFILE']
      });

      expectFailure(result, 'INTERNAL_SERVER_ERROR');
    });
  });

  describe('when the module is loaded without twitter configuration', () => {
    it('returns INTERNAL_SERVER_ERROR after the team check when the client id is missing', async () => {
      const freshConnectTwitter = await loadWithEnv({
        TWITTER_TEAM_APP_CLIENT_ID: '',
        NEXTAUTH_URL: 'https://giveaway.test'
      });
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team());

      const result = await freshConnectTwitter({
        slug: 'acme',
        features: ['GET_PROFILE']
      });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Twitter OAuth not configured'
      );
      expect(prismaMock.team.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaMock.state.create).not.toHaveBeenCalled();
    });

    it('builds a literal "undefined" redirect uri when NEXTAUTH_URL is unset', async () => {
      const freshConnectTwitter = await loadWithEnv({
        TWITTER_TEAM_APP_CLIENT_ID: 'client-id',
        NEXTAUTH_URL: undefined
      });
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team());
      prismaMock.state.create.mockResolvedValue({ id: 'state-1' });

      const result = await freshConnectTwitter({
        slug: 'acme',
        features: ['GET_PROFILE']
      });

      const { params } = authParams(expectOk(result).authUrl);
      expect(params.get('redirect_uri')).toBe(
        'undefined/api/auth/twitter-callback'
      );
    });
  });
});
