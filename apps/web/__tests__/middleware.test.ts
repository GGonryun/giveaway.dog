import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { AsyncLocalStorage } from 'node:async_hooks';
import { NextRequest, NextResponse } from 'next/server';
import middleware, { config } from '../middleware';
import { authConfigMiddleware } from '@giveaway/auth-core/config-middleware';
import { CSP_REPORT_PATH } from '@giveaway/csp-model/policy';

const m = vi.hoisted(() => {
  const auth = vi.fn();
  return {
    auth,
    NextAuth: vi.fn(() => ({
      auth,
      handlers: { GET: vi.fn(), POST: vi.fn() },
      signIn: vi.fn(),
      signOut: vi.fn(),
      unstable_update: vi.fn()
    }))
  };
});

vi.mock('next-auth', () => ({ default: m.NextAuth }));

describe('middleware', () => {
  describe('default export', () => {
    it('creates a NextAuth instance from the middleware auth config', () => {
      expect(m.NextAuth).toHaveBeenCalledExactlyOnceWith(authConfigMiddleware);
    });

    it('runs the auth handler of that instance with the request', async () => {
      const request = new NextRequest('http://localhost:3000/browse');
      const context = { waitUntil: vi.fn() };
      m.auth.mockResolvedValueOnce(NextResponse.next());

      await middleware(request, context);

      expect(m.auth).toHaveBeenCalledWith(request, context);
    });

    it('returns a redirect of the auth handler unchanged', async () => {
      const redirect = NextResponse.redirect('http://localhost:3000/login');
      m.auth.mockResolvedValueOnce(redirect);

      const response = await middleware(
        new NextRequest('http://localhost:3000/app'),
        {}
      );

      expect(response).toBe(redirect);
      expect(
        response.headers.get('content-security-policy-report-only')
      ).toBeNull();
    });
  });

  describe('content security policy', () => {
    const run = async () => {
      const next = NextResponse.next();
      next.headers.append('set-cookie', 'a=1; Path=/');
      next.headers.append('set-cookie', 'b=2; Path=/');
      m.auth.mockResolvedValueOnce(next);
      return middleware(new NextRequest('http://localhost:3000/browse'), {});
    };

    const nonceOf = (policy: string | null) =>
      policy?.match(/'nonce-([^']+)'/)?.[1];

    it('sends the report-only policy with a nonce', async () => {
      const response = await run();
      const policy = response.headers.get(
        'content-security-policy-report-only'
      );

      expect(response.headers.get('content-security-policy')).toBeNull();
      expect(policy).toContain("'strict-dynamic'");
      expect(policy).toContain("object-src 'none'");
      expect(policy).toContain(`report-uri ${CSP_REPORT_PATH}`);
      expect(nonceOf(policy)).toBeTruthy();
    });

    it('passes the nonce and the policy to the render', async () => {
      const response = await run();
      const policy = response.headers.get(
        'content-security-policy-report-only'
      );

      expect(response.headers.get('x-middleware-next')).toBe('1');
      expect(
        response.headers.get('x-middleware-override-headers')?.split(',')
      ).toEqual(
        expect.arrayContaining([
          'x-nonce',
          'content-security-policy-report-only'
        ])
      );
      expect(response.headers.get('x-middleware-request-x-nonce')).toBe(
        nonceOf(policy)
      );
      expect(
        response.headers.get(
          'x-middleware-request-content-security-policy-report-only'
        )
      ).toBe(policy);
    });

    it('keeps the cookies of the auth handler', async () => {
      const response = await run();

      expect(response.headers.getSetCookie()).toEqual([
        'a=1; Path=/',
        'b=2; Path=/'
      ]);
    });

    it('uses a new nonce for each request', async () => {
      const first = await run();
      const second = await run();

      expect(first.headers.get('x-middleware-request-x-nonce')).not.toBe(
        second.headers.get('x-middleware-request-x-nonce')
      );
    });
  });

  describe('config', () => {
    it('declares a single negative lookahead matcher', () => {
      expect(config).toEqual({
        matcher: [
          '/((?!api|_next/static|_next/image|favicon.ico|.well-known/workflow/*|.*\\.(?:avif|gif|ico|jpe?g|png|svg|webp|woff2?)$).*)'
        ]
      });
    });
  });

  describe('config matcher', () => {
    let matches: (path: string) => boolean;

    beforeAll(async () => {
      vi.stubGlobal('AsyncLocalStorage', AsyncLocalStorage);
      const { unstable_doesMiddlewareMatch } =
        await import('next/experimental/testing/server');
      matches = (path) =>
        unstable_doesMiddlewareMatch({
          config,
          url: `http://localhost:3000${path}`
        });
    });

    afterAll(() => {
      vi.unstubAllGlobals();
    });

    it.each([
      '/',
      '/app',
      '/app/api',
      '/browse',
      '/login',
      '/robots.txt',
      '/sitemap.xml',
      '/_next/data/build/index.json',
      '/.well-known/openid-configuration'
    ])('runs on %s', (path) => {
      expect(matches(path)).toBe(true);
    });

    it.each([
      '/api',
      '/api/auth/session',
      '/_next/static/chunks/main.js',
      '/_next/image?url=%2Fdog.png',
      '/favicon.ico',
      '/favicon.png',
      '/platforms/discord.svg',
      '/images/demo-sweepstakes-banner-2.jpg',
      '/fonts/figtree.woff2',
      '/.well-known/workflow',
      '/.well-known/workflow/v1/flow'
    ])('skips %s', (path) => {
      expect(matches(path)).toBe(false);
    });

    it.each(['/apiary', '/api-docs', '/favicon.ico.png'])(
      'also skips %s because the excluded prefixes are not segment bound',
      (path) => {
        expect(matches(path)).toBe(false);
      }
    );

    it('also skips paths where the unescaped dot of .well-known matches any character', () => {
      expect(matches('/xwell-known/workflow/a')).toBe(false);
    });
  });
});
