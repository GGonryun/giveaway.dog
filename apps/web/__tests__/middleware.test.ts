import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { AsyncLocalStorage } from 'node:async_hooks';
import middleware, { config } from '../middleware';
import { authConfigMiddleware } from '@giveaway/auth-core/config-middleware';

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
vi.mock('@giveaway/cache/redis', () => ({ redis: {} }));

describe('middleware', () => {
  describe('default export', () => {
    it('creates a NextAuth instance from the middleware auth config', () => {
      expect(m.NextAuth).toHaveBeenCalledExactlyOnceWith(authConfigMiddleware);
    });

    it('exports the auth handler of that instance', () => {
      expect(middleware).toBe(m.auth);
    });
  });

  describe('config', () => {
    it('declares a single negative lookahead matcher', () => {
      expect(config).toEqual({
        matcher: [
          '/((?!api|_next/static|_next/image|favicon.ico|.well-known/workflow/*|images/|platforms/|hosts/|people/).*)'
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
      '/favicon.png',
      '/robots.txt',
      '/sitemap.xml',
      '/_next/data/build/index.json',
      '/.well-known/openid-configuration',
      '/browse/images',
      '/logo.png'
    ])('runs on %s', (path) => {
      expect(matches(path)).toBe(true);
    });

    it.each([
      '/api',
      '/api/auth/session',
      '/_next/static/chunks/main.js',
      '/_next/image?url=%2Fdog.png',
      '/favicon.ico',
      '/.well-known/workflow',
      '/.well-known/workflow/v1/flow',
      '/images/demo-sweepstakes-banner-2.jpg',
      '/platforms/x.svg',
      '/hosts/host.png',
      '/people/person.png'
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
