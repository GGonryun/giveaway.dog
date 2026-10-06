import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

const m = vi.hoisted(() => ({
  getBlueskyClient: vi.fn(),
  authorize: vi.fn()
}));

vi.mock('@giveaway/bluesky-api/bluesky/bluesky-client', () => ({
  getBlueskyClient: m.getBlueskyClient
}));

const AUTH_URL = 'https://bsky.social/oauth/authorize?request_uri=urn%3Areq';
const APP_URL = 'https://app.giveaway.dog';

const request = (params: Record<string, string>) => {
  const url = new URL('http://localhost:3000/api/bluesky/user/authorize');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
};

describe('bluesky user authorize GET', () => {
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
    m.getBlueskyClient.mockReset();
    m.getBlueskyClient.mockResolvedValue({ authorize: m.authorize });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('when the handle is missing', () => {
    it('returns a 400 JSON error', async () => {
      const res = await GET(request({ redirectTo: '/browse' }));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        error: 'Handle parameter is required'
      });
    });

    it('treats an empty handle as missing', async () => {
      const res = await GET(request({ handle: '' }));

      expect(res.status).toBe(400);
    });

    it('does not create the Bluesky client', async () => {
      await GET(request({}));

      expect(m.getBlueskyClient).not.toHaveBeenCalled();
    });

    it('logs a warning', async () => {
      await GET(request({}));

      expect(consoleWarn).toHaveBeenCalledWith(
        'Bluesky authorization failed - missing handle'
      );
    });
  });

  describe('when the authorization starts successfully', () => {
    it('redirects to the authorization URL from the Bluesky client', async () => {
      const res = await GET(request({ handle: 'alice.bsky.social' }));

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe(AUTH_URL);
    });

    it('authorizes the handle without extra options', async () => {
      await GET(request({ handle: 'alice.bsky.social' }));

      expect(m.authorize).toHaveBeenCalledWith('alice.bsky.social');
    });

    it('stores redirectTo in a short-lived http-only cookie', async () => {
      const res = await GET(
        request({ handle: 'alice.bsky.social', redirectTo: '/browse/123' })
      );

      expect(res.cookies.get('bluesky_redirect')).toMatchObject({
        value: '/browse/123',
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 600,
        path: '/'
      });
    });

    it('marks the redirect cookie secure in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      const res = await GET(
        request({ handle: 'alice.bsky.social', redirectTo: '/browse/123' })
      );

      expect(res.cookies.get('bluesky_redirect')?.secure).toBe(true);
    });

    it('does not set the redirect cookie when redirectTo is absent', async () => {
      const res = await GET(request({ handle: 'alice.bsky.social' }));

      expect(res.cookies.get('bluesky_redirect')).toBeUndefined();
      expect(res.headers.getSetCookie()).toEqual([]);
    });

    it('does not set the redirect cookie when redirectTo is empty', async () => {
      const res = await GET(
        request({ handle: 'alice.bsky.social', redirectTo: '' })
      );

      expect(res.cookies.get('bluesky_redirect')).toBeUndefined();
    });

    it('logs the start of the authorization', async () => {
      await GET(request({ handle: 'alice.bsky.social' }));

      expect(consoleInfo).toHaveBeenCalledWith(
        'Bluesky authorization started',
        { handle: 'alice.bsky.social', redirectTo: null, returnTo: '/' }
      );
    });

    it('logs the redirect targets given in the query', async () => {
      await GET(
        request({
          handle: 'alice.bsky.social',
          redirectTo: '/browse/123',
          returnTo: '/login'
        })
      );

      expect(consoleInfo).toHaveBeenCalledWith(
        'Bluesky authorization started',
        {
          handle: 'alice.bsky.social',
          redirectTo: '/browse/123',
          returnTo: '/login'
        }
      );
    });

    it('logs the host of the generated authorization URL', async () => {
      await GET(request({ handle: 'alice.bsky.social' }));

      expect(consoleInfo).toHaveBeenCalledWith(
        'Bluesky authorization URL generated',
        { handle: 'alice.bsky.social', authUrlHost: 'bsky.social' }
      );
    });
  });

  describe('when the Bluesky client fails', () => {
    it('redirects to returnTo with an auth failure error when authorize rejects', async () => {
      m.authorize.mockRejectedValue(new Error('handle not found'));

      const res = await GET(
        request({ handle: 'alice.bsky.social', returnTo: '/login' })
      );

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe(
        `${APP_URL}/login?error=bluesky_auth_failed`
      );
    });

    it('redirects with an auth failure error when the client cannot be created', async () => {
      m.getBlueskyClient.mockRejectedValue(new Error('missing key'));

      const res = await GET(request({ handle: 'alice.bsky.social' }));

      expect(res.headers.get('location')).toBe(
        `${APP_URL}/?error=bluesky_auth_failed`
      );
    });

    it('redirects with an auth failure error when the authorization URL is invalid', async () => {
      m.authorize.mockResolvedValue('not a url');

      const res = await GET(request({ handle: 'alice.bsky.social' }));

      expect(res.headers.get('location')).toBe(
        `${APP_URL}/?error=bluesky_auth_failed`
      );
    });

    it('does not set the redirect cookie on failure', async () => {
      m.authorize.mockRejectedValue(new Error('handle not found'));

      const res = await GET(
        request({ handle: 'alice.bsky.social', redirectTo: '/browse' })
      );

      expect(res.cookies.get('bluesky_redirect')).toBeUndefined();
    });

    it('falls back to the deployment URL when NEXT_PUBLIC_APP_URL is unset', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', undefined);
      m.authorize.mockRejectedValue(new Error('handle not found'));

      const res = await GET(request({ handle: 'alice.bsky.social' }));

      expect(res.headers.get('location')).toBe(
        'https://giveaway-abc123-team.vercel.app/?error=bluesky_auth_failed'
      );
    });

    it('replaces an existing error parameter on returnTo', async () => {
      m.authorize.mockRejectedValue(new Error('handle not found'));

      const res = await GET(
        request({
          handle: 'alice.bsky.social',
          returnTo: '/login?error=old&next=1'
        })
      );

      expect(res.headers.get('location')).toBe(
        `${APP_URL}/login?error=bluesky_auth_failed&next=1`
      );
    });

    it('follows an absolute returnTo to another origin', async () => {
      m.authorize.mockRejectedValue(new Error('handle not found'));

      const res = await GET(
        request({
          handle: 'alice.bsky.social',
          returnTo: 'https://evil.example/phish'
        })
      );

      expect(res.headers.get('location')).toBe(
        'https://evil.example/phish?error=bluesky_auth_failed'
      );
    });

    it('falls back to localhost when no URL is configured', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', undefined);
      vi.stubEnv('VERCEL_URL', undefined);
      m.authorize.mockRejectedValue(new Error('handle not found'));

      const res = await GET(request({ handle: 'alice.bsky.social' }));

      expect(res.headers.get('location')).toBe(
        'http://localhost:3000/?error=bluesky_auth_failed'
      );
    });

    it('logs the underlying error', async () => {
      const failure = new Error('handle not found');
      m.authorize.mockRejectedValue(failure);

      await GET(request({ handle: 'alice.bsky.social' }));

      expect(consoleError).toHaveBeenCalledWith(
        'Bluesky authorization failed:',
        failure
      );
    });
  });
});
