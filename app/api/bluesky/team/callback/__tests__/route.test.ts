import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { IntegrationProvider, IntegrationStatus } from '@prisma/client';
import { GET } from '../route';
import { prismaMock } from '@/test/prisma';
import { createSession, TEST_USER } from '@/test/session';
import { ApplicationError } from '@/lib/errors';

const m = vi.hoisted(() => {
  const getProfile = vi.fn();
  return {
    auth: vi.fn(),
    getTeamBlueskyClient: vi.fn(),
    callback: vi.fn(),
    getProfile,
    Agent: vi.fn(function Agent() {
      return { getProfile };
    })
  };
});

vi.mock('@/lib/auth/config', () => ({
  auth: m.auth,
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() }
}));

vi.mock('@/lib/bluesky/team-bluesky-client', () => ({
  getTeamBlueskyClient: m.getTeamBlueskyClient
}));

vi.mock('@atproto/api', () => ({
  Agent: m.Agent
}));

const APP_URL = 'https://app.giveaway.dog';
const DID = 'did:plc:acme';
const BLUESKY_SESSION = { did: DID, sub: DID };
const TEAM = { id: 'team-1', slug: 'acme', name: 'Acme' };
const INTEGRATIONS = `${APP_URL}/app/acme/settings/integrations`;

const request = (
  params: Record<string, string> = { code: 'code-1', state: 'state-1' },
  cookies: Record<string, string> = {
    bluesky_team_slug: 'acme',
    bluesky_team_scope: 'atproto'
  }
) => {
  const url = new URL('http://localhost:3000/api/bluesky/team/callback');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const cookie = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
  return new NextRequest(url, { headers: cookie ? { cookie } : {} });
};

const errorLocation = (message: string, slug = 'acme') =>
  `${APP_URL}/app/${slug}/settings/integrations?error=${encodeURIComponent(message)}`;

describe('bluesky team callback GET', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('NEXT_PUBLIC_APP_URL', APP_URL);
    vi.stubEnv('NEXTAUTH_URL', 'https://auth.giveaway.dog');
    m.auth.mockReset();
    m.auth.mockResolvedValue(createSession());
    m.callback.mockReset();
    m.callback.mockResolvedValue({ session: BLUESKY_SESSION });
    m.getTeamBlueskyClient.mockReset();
    m.getTeamBlueskyClient.mockResolvedValue({ callback: m.callback });
    m.getProfile.mockReset();
    m.getProfile.mockResolvedValue({
      data: { did: DID, handle: 'acme.bsky.social', displayName: 'Acme Inc' }
    });
    m.Agent.mockClear();
    prismaMock.team.findUnique.mockResolvedValue(TEAM);
    prismaMock.user.findFirst.mockResolvedValue({
      id: TEST_USER.id,
      teams: [{ teamId: TEAM.id }]
    });
    prismaMock.integration.findFirst.mockResolvedValue({
      id: 'integration-1',
      teamId: TEAM.id
    });
    prismaMock.integration.update.mockResolvedValue({ id: 'integration-1' });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('when the user is not authenticated', () => {
    it('throws an UNAUTHORIZED application error when there is no session', async () => {
      m.auth.mockResolvedValue(null);

      const promise = GET(request());

      await expect(promise).rejects.toBeInstanceOf(ApplicationError);
      await expect(promise).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    });

    it('throws when the session has no user id', async () => {
      m.auth.mockResolvedValue({ user: {}, expires: '2999-01-01' });

      await expect(GET(request())).rejects.toMatchObject({
        code: 'UNAUTHORIZED'
      });
    });

    it('does not touch the database or the Bluesky client', async () => {
      m.auth.mockResolvedValue(null);

      await GET(request()).catch(() => undefined);

      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
      expect(m.getTeamBlueskyClient).not.toHaveBeenCalled();
    });
  });

  describe('when the team context cookies are missing', () => {
    it('redirects with an undefined slug when the slug cookie is missing', async () => {
      const res = await GET(
        request(undefined, { bluesky_team_scope: 'atproto' })
      );

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe(
        errorLocation('Team context not found', 'undefined')
      );
    });

    it('redirects with a scope error when the scope cookie is missing', async () => {
      const res = await GET(request(undefined, { bluesky_team_slug: 'acme' }));

      expect(res.headers.get('location')).toBe(
        errorLocation('Bluesky scope not found')
      );
    });

    it('does not look up the team', async () => {
      await GET(request(undefined, {}));

      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when Bluesky returns an error parameter', () => {
    it('redirects with the OAuth error message', async () => {
      const res = await GET(
        request({ error: 'access_denied', error_description: 'User denied' })
      );

      expect(res.headers.get('location')).toBe(
        errorLocation('Bluesky OAuth error')
      );
    });

    it('logs the application error with the provider details', async () => {
      await GET(
        request({ error: 'access_denied', error_description: 'User denied' })
      );

      expect(consoleError).toHaveBeenCalledWith(
        'Bluesky OAuth callback error:',
        expect.objectContaining({
          code: 'BAD_REQUEST',
          data: { error: 'access_denied', errorDescription: 'User denied' }
        })
      );
    });

    it('does not look up the team', async () => {
      await GET(request({ error: 'access_denied' }));

      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the team cannot be resolved', () => {
    it('looks up the team by the slug cookie', async () => {
      await GET(request());

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
        where: { slug: 'acme' }
      });
    });

    it('redirects with a not found error when the team does not exist', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      const res = await GET(request());

      expect(res.headers.get('location')).toBe(errorLocation('Team not found'));
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('when the user is not a member of the team', () => {
    it('checks membership for the signed-in user', async () => {
      await GET(request());

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: TEST_USER.id,
          teams: { some: { teamId: TEAM.id } }
        },
        include: { teams: true }
      });
    });

    it('redirects with a forbidden error', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const res = await GET(request());

      expect(res.headers.get('location')).toBe(
        errorLocation('User is not a member of the team')
      );
      expect(m.getTeamBlueskyClient).not.toHaveBeenCalled();
    });
  });

  describe('when completing the Bluesky OAuth exchange', () => {
    it('passes the callback query parameters to the Bluesky client', async () => {
      await GET(request({ code: 'code-1', state: 'state-1', iss: 'bsky' }));

      expect(m.callback).toHaveBeenCalledTimes(1);
      const params = m.callback.mock.calls[0][0] as URLSearchParams;
      expect(params.toString()).toBe('code=code-1&state=state-1&iss=bsky');
    });

    it('fetches the profile of the authorized DID', async () => {
      await GET(request());

      expect(m.Agent).toHaveBeenCalledWith(BLUESKY_SESSION);
      expect(m.getProfile).toHaveBeenCalledWith({ actor: DID });
    });

    it('looks up the existing Bluesky integration by DID', async () => {
      await GET(request());

      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: { account_id: DID, provider: IntegrationProvider.BLUESKY }
      });
    });

    it('redirects with a generic message when the OAuth exchange throws', async () => {
      m.callback.mockRejectedValue(new Error('invalid_grant'));

      const res = await GET(request());

      expect(res.headers.get('location')).toBe(
        errorLocation('Failed to connect Bluesky')
      );
    });

    it('redirects with a generic message when the profile fetch throws', async () => {
      m.getProfile.mockRejectedValue(new Error('network'));

      const res = await GET(request());

      expect(res.headers.get('location')).toBe(
        errorLocation('Failed to connect Bluesky')
      );
      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });

    it('logs the underlying error', async () => {
      const failure = new Error('invalid_grant');
      m.callback.mockRejectedValue(failure);

      await GET(request());

      expect(consoleError).toHaveBeenCalledWith(
        'Bluesky OAuth callback error:',
        failure
      );
    });
  });

  describe('when the integration does not exist', () => {
    it('redirects with a not found error', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      const res = await GET(request());

      expect(res.headers.get('location')).toBe(
        errorLocation('Bluesky integration not found')
      );
      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });
  });

  describe('when the integration belongs to another team', () => {
    beforeEach(() => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'integration-1',
        teamId: 'team-2'
      });
    });

    it('redirects with a forbidden error', async () => {
      const res = await GET(request());

      expect(res.headers.get('location')).toBe(
        errorLocation(
          'Bluesky integration is already connected on a different team'
        )
      );
    });

    it('does not update the integration', async () => {
      await GET(request());

      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });

    it('records the conflicting team in the error cause', async () => {
      await GET(request());

      expect(consoleError).toHaveBeenCalledWith(
        'Bluesky OAuth callback error:',
        expect.objectContaining({
          code: 'FORBIDDEN',
          cause: 'Integration ID integration-1 is connected to team ID team-2'
        })
      );
    });
  });

  describe('when the integration can be claimed', () => {
    it('updates the integration with the profile and cookie scope', async () => {
      await GET(request());

      expect(prismaMock.integration.update).toHaveBeenCalledWith({
        where: { id: 'integration-1' },
        data: {
          account_id: DID,
          label: 'Acme Inc',
          scope: 'atproto',
          ownerId: TEST_USER.id,
          teamId: TEAM.id,
          status: IntegrationStatus.ACTIVE
        }
      });
    });

    it('claims an integration that has no team yet', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'integration-1',
        teamId: null
      });

      const res = await GET(request());

      expect(prismaMock.integration.update).toHaveBeenCalledTimes(1);
      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?success=bluesky_connected&handle=acme.bsky.social`
      );
    });

    it('labels the integration with the handle when the display name is empty', async () => {
      m.getProfile.mockResolvedValue({
        data: { did: DID, handle: 'acme.bsky.social', displayName: '' }
      });

      await GET(request());

      expect(prismaMock.integration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ label: 'acme.bsky.social' })
        })
      );
    });

    it('labels the integration with the handle when the display name is missing', async () => {
      m.getProfile.mockResolvedValue({
        data: { did: DID, handle: 'acme.bsky.social' }
      });

      await GET(request());

      expect(prismaMock.integration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ label: 'acme.bsky.social' })
        })
      );
    });

    it('redirects to the team integrations page with the connected handle', async () => {
      const res = await GET(request());

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe(
        `${INTEGRATIONS}?success=bluesky_connected&handle=acme.bsky.social`
      );
    });

    it('uses the slug stored on the team record in the redirect', async () => {
      prismaMock.team.findUnique.mockResolvedValue({
        ...TEAM,
        slug: 'acme-renamed'
      });

      const res = await GET(request());

      expect(res.headers.get('location')).toBe(
        `${APP_URL}/app/acme-renamed/settings/integrations?success=bluesky_connected&handle=acme.bsky.social`
      );
    });

    it('clears both team context cookies', async () => {
      const res = await GET(request());

      expect(res.cookies.get('bluesky_team_slug')).toMatchObject({
        value: '',
        expires: new Date(0)
      });
      expect(res.cookies.get('bluesky_team_scope')).toMatchObject({
        value: '',
        expires: new Date(0)
      });
    });

    it('falls back to NEXTAUTH_URL for the redirect base', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', undefined);

      const res = await GET(request());

      expect(res.headers.get('location')).toBe(
        'https://auth.giveaway.dog/app/acme/settings/integrations?success=bluesky_connected&handle=acme.bsky.social'
      );
    });

    it('throws when no base URL is configured', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', undefined);
      vi.stubEnv('NEXTAUTH_URL', undefined);

      await expect(GET(request())).rejects.toThrow('Invalid URL');
    });
  });

  it('does not clear the team context cookies on failure', async () => {
    prismaMock.team.findUnique.mockResolvedValue(null);

    const res = await GET(request());

    expect(res.headers.getSetCookie()).toEqual([]);
  });

  it('falls back to NEXTAUTH_URL for the error redirect base', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', undefined);
    prismaMock.team.findUnique.mockResolvedValue(null);

    const res = await GET(request());

    expect(res.headers.get('location')).toBe(
      `https://auth.giveaway.dog/app/acme/settings/integrations?error=${encodeURIComponent('Team not found')}`
    );
  });
});
