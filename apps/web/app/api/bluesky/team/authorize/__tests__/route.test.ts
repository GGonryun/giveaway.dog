import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { TeamRole } from '@prisma/client';
import { GET } from '../route';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { createSession, TEST_USER } from '@giveaway/testing-server/session';

const m = vi.hoisted(() => ({
  auth: vi.fn(),
  getTeamBlueskyClient: vi.fn(),
  authorize: vi.fn()
}));

vi.mock('@giveaway/auth-server/config', () => ({
  auth: m.auth,
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() }
}));

vi.mock('@giveaway/bluesky-api/bluesky/team-bluesky-client', () => ({
  getTeamBlueskyClient: m.getTeamBlueskyClient
}));

const teamWithRole = (role: TeamRole, userId = TEST_USER.id) => ({
  id: 'team-1',
  slug: 'acme',
  members: [{ teamId: 'team-1', userId, role }]
});

const AUTH_URL = 'https://bsky.social/oauth/authorize?request_uri=urn%3Areq';
const APP_URL = 'https://app.giveaway.dog';

const request = (params: Record<string, string>) => {
  const url = new URL('http://localhost:3000/api/bluesky/team/authorize');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
};

const validParams = {
  handle: 'acme.bsky.social',
  slug: 'acme',
  scope: 'atproto transition:generic',
  returnTo: '/app/acme/settings/integrations'
};

const paramsWithout = (key: keyof typeof validParams) =>
  Object.fromEntries(
    Object.entries(validParams).filter(([name]) => name !== key)
  );

describe('bluesky team authorize GET', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;
  let consoleWarn: ReturnType<typeof vi.spyOn>;
  let consoleInfo: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.stubEnv('NEXT_PUBLIC_APP_URL', APP_URL);
    vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', undefined);
    vi.stubEnv('VERCEL_URL', 'giveaway-abc123-team.vercel.app');
    vi.stubEnv('NODE_ENV', 'test');
    m.authorize.mockReset();
    m.authorize.mockResolvedValue(new URL(AUTH_URL));
    m.getTeamBlueskyClient.mockReset();
    m.getTeamBlueskyClient.mockResolvedValue({ authorize: m.authorize });
    m.auth.mockReset();
    m.auth.mockResolvedValue(createSession());
    prismaMock.team.findUnique.mockResolvedValue(teamWithRole(TeamRole.OWNER));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('when the authorization starts successfully', () => {
    it('redirects to the authorization URL from the Bluesky client', async () => {
      const res = await GET(request(validParams));

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe(AUTH_URL);
    });

    it('authorizes the handle with the fixed generic scope', async () => {
      await GET(request({ ...validParams, scope: 'custom-scope' }));

      expect(m.authorize).toHaveBeenCalledWith('acme.bsky.social', {
        scope: 'atproto transition:generic'
      });
    });

    it('stores the team slug in a short-lived http-only cookie', async () => {
      const res = await GET(request(validParams));

      expect(res.cookies.get('bluesky_team_slug')).toMatchObject({
        value: 'acme',
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 600,
        path: '/'
      });
    });

    it('stores the requested scope in a short-lived http-only cookie', async () => {
      const res = await GET(request({ ...validParams, scope: 'custom-scope' }));

      expect(res.cookies.get('bluesky_team_scope')).toMatchObject({
        value: 'custom-scope',
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 600,
        path: '/'
      });
    });

    it('marks both cookies secure in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      const res = await GET(request(validParams));

      expect(res.cookies.get('bluesky_team_slug')?.secure).toBe(true);
      expect(res.cookies.get('bluesky_team_scope')?.secure).toBe(true);
    });

    it('logs the start of the authorization with the default returnTo', async () => {
      await GET(request(paramsWithout('returnTo')));

      expect(consoleInfo).toHaveBeenCalledWith(
        'Bluesky team authorization started',
        {
          handle: 'acme.bsky.social',
          slug: 'acme',
          scope: 'atproto transition:generic',
          returnTo: '/'
        }
      );
    });

    it('logs the host of the generated authorization URL', async () => {
      await GET(request(validParams));

      expect(consoleInfo).toHaveBeenCalledWith(
        'Bluesky team authorization URL generated',
        { handle: 'acme.bsky.social', authUrlHost: 'bsky.social' }
      );
    });
  });

  describe('when the user may not connect the team integrations', () => {
    const FAILURE = `${APP_URL}/app/acme/settings/integrations?error=bluesky_auth_failed`;

    it('redirects with an auth failure error when there is no session', async () => {
      m.auth.mockResolvedValue(null);

      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(FAILURE);
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
      expect(m.getTeamBlueskyClient).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith(
        'Bluesky team authorization failed:',
        expect.objectContaining({
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        })
      );
    });

    it('redirects with an auth failure error when the session has no user id', async () => {
      m.auth.mockResolvedValue({ user: {}, expires: '2999-01-01' });

      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(FAILURE);
      expect(m.getTeamBlueskyClient).not.toHaveBeenCalled();
    });

    it('looks up the team of the slug with its members', async () => {
      await GET(request(validParams));

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
        where: { slug: 'acme' },
        include: { members: true }
      });
    });

    it('redirects with an auth failure error when the team does not exist', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(FAILURE);
      expect(m.getTeamBlueskyClient).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith(
        'Bluesky team authorization failed:',
        expect.objectContaining({
          code: 'NOT_FOUND',
          message: 'Team not found'
        })
      );
    });

    it('[TEAM-006] does not start the flow for a person who is not a member', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        teamWithRole(TeamRole.OWNER, 'someone-else')
      );

      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(FAILURE);
      expect(m.getTeamBlueskyClient).not.toHaveBeenCalled();
      expect(res.headers.getSetCookie()).toEqual([]);
      expect(consoleError).toHaveBeenCalledWith(
        'Bluesky team authorization failed:',
        expect.objectContaining({
          code: 'FORBIDDEN',
          message: 'You are not a member of this team'
        })
      );
    });

    const expectRefused = async (role: TeamRole) => {
      prismaMock.team.findUnique.mockResolvedValue(teamWithRole(role));

      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(FAILURE);
      expect(m.getTeamBlueskyClient).not.toHaveBeenCalled();
      expect(m.authorize).not.toHaveBeenCalled();
      expect(res.headers.getSetCookie()).toEqual([]);
      expect(consoleError).toHaveBeenCalledWith(
        'Bluesky team authorization failed:',
        expect.objectContaining({
          code: 'FORBIDDEN',
          message:
            'You do not have permission to perform this action. Required permission: UPDATE_INTEGRATIONS'
        })
      );
    };

    it('[ROLE-006] does not start the flow for a guest', async () => {
      await expectRefused(TeamRole.GUEST);
    });

    it('[ROLE-001] does not start the flow for a blocked member', async () => {
      await expectRefused(TeamRole.BLOCKED);
    });

    it.each([TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER])(
      'starts the flow for the %s of the team',
      async (role) => {
        prismaMock.team.findUnique.mockResolvedValue(teamWithRole(role));

        const res = await GET(request(validParams));

        expect(res.headers.get('location')).toBe(AUTH_URL);
      }
    );
  });

  describe('when the handle is missing', () => {
    it('returns a 400 JSON error', async () => {
      const res = await GET(request(paramsWithout('handle')));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        error: 'Handle parameter is required'
      });
    });

    it('does not create the Bluesky client', async () => {
      await GET(request({ ...validParams, handle: '' }));

      expect(m.getTeamBlueskyClient).not.toHaveBeenCalled();
    });

    it('logs a warning', async () => {
      await GET(request({ ...validParams, handle: '' }));

      expect(consoleWarn).toHaveBeenCalledWith(
        'Bluesky team authorization failed - missing handle'
      );
    });
  });

  describe('when the slug is missing', () => {
    it('redirects to returnTo with an auth failure error', async () => {
      const res = await GET(request(paramsWithout('slug')));

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe(
        `${APP_URL}/app/acme/settings/integrations?error=bluesky_auth_failed`
      );
    });

    it('checks the slug before the handle', async () => {
      const res = await GET(request({ scope: 'atproto' }));

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe(
        `${APP_URL}/?error=bluesky_auth_failed`
      );
    });

    it('logs the application error', async () => {
      await GET(request({ ...validParams, slug: '' }));

      expect(consoleError).toHaveBeenCalledWith(
        'Bluesky team authorization failed:',
        expect.objectContaining({
          code: 'BAD_REQUEST',
          message: 'Slug parameter is required'
        })
      );
    });
  });

  describe('when the scope is missing', () => {
    it('redirects to returnTo with an auth failure error', async () => {
      const res = await GET(request({ ...validParams, scope: '' }));

      expect(res.headers.get('location')).toBe(
        `${APP_URL}/app/acme/settings/integrations?error=bluesky_auth_failed`
      );
    });

    it('logs the application error', async () => {
      await GET(request({ ...validParams, scope: '' }));

      expect(consoleError).toHaveBeenCalledWith(
        'Bluesky team authorization failed:',
        expect.objectContaining({
          code: 'BAD_REQUEST',
          message: 'Scope parameter is required'
        })
      );
    });
  });

  describe('when the Bluesky client fails', () => {
    it('redirects with an auth failure error when the client cannot be created', async () => {
      m.getTeamBlueskyClient.mockRejectedValue(new Error('missing key'));

      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(
        `${APP_URL}/app/acme/settings/integrations?error=bluesky_auth_failed`
      );
    });

    it('redirects with an auth failure error when authorize rejects', async () => {
      m.authorize.mockRejectedValue(new Error('handle not found'));

      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(
        `${APP_URL}/app/acme/settings/integrations?error=bluesky_auth_failed`
      );
    });

    it('redirects with an auth failure error when the authorization URL is invalid', async () => {
      m.authorize.mockResolvedValue('not a url');

      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(
        `${APP_URL}/app/acme/settings/integrations?error=bluesky_auth_failed`
      );
    });

    it('logs the underlying error', async () => {
      const failure = new Error('handle not found');
      m.authorize.mockRejectedValue(failure);

      await GET(request(validParams));

      expect(consoleError).toHaveBeenCalledWith(
        'Bluesky team authorization failed:',
        failure
      );
    });
  });

  describe('when building the failure redirect', () => {
    beforeEach(() => {
      m.authorize.mockRejectedValue(new Error('boom'));
    });

    it('defaults returnTo to the site root', async () => {
      const res = await GET(request(paramsWithout('returnTo')));

      expect(res.headers.get('location')).toBe(
        `${APP_URL}/?error=bluesky_auth_failed`
      );
    });

    it('falls back to the deployment URL when NEXT_PUBLIC_APP_URL is unset', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', undefined);

      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(
        'https://giveaway-abc123-team.vercel.app/app/acme/settings/integrations?error=bluesky_auth_failed'
      );
    });

    it('preserves existing query parameters on returnTo', async () => {
      const res = await GET(
        request({ ...validParams, returnTo: '/app/acme?tab=social' })
      );

      expect(res.headers.get('location')).toBe(
        `${APP_URL}/app/acme?tab=social&error=bluesky_auth_failed`
      );
    });

    it('replaces an existing error parameter on returnTo', async () => {
      const res = await GET(
        request({ ...validParams, returnTo: '/app/acme?error=old&tab=social' })
      );

      expect(res.headers.get('location')).toBe(
        `${APP_URL}/app/acme?error=bluesky_auth_failed&tab=social`
      );
    });

    it('does not set the team context cookies', async () => {
      const res = await GET(request(validParams));

      expect(res.headers.getSetCookie()).toEqual([]);
    });

    it('follows an absolute returnTo to another origin', async () => {
      const res = await GET(
        request({ ...validParams, returnTo: 'https://evil.example/phish' })
      );

      expect(res.headers.get('location')).toBe(
        'https://evil.example/phish?error=bluesky_auth_failed'
      );
    });

    it('falls back to localhost when no URL is configured', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', undefined);
      vi.stubEnv('VERCEL_URL', undefined);

      const res = await GET(request(validParams));

      expect(res.headers.get('location')).toBe(
        'http://localhost:3000/app/acme/settings/integrations?error=bluesky_auth_failed'
      );
    });
  });
});
