import { describe, it, expect, vi, afterEach } from 'vitest';
import { environment } from '../environment';

describe('environment', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('is', () => {
    it('returns true for development when NODE_ENV is development', () => {
      vi.stubEnv('NODE_ENV', 'development');

      expect(environment.is('development')).toBe(true);
    });

    it('returns false for production when NODE_ENV is development', () => {
      vi.stubEnv('NODE_ENV', 'development');

      expect(environment.is('production')).toBe(false);
    });

    it('returns true for production when NODE_ENV is production', () => {
      vi.stubEnv('NODE_ENV', 'production');

      expect(environment.is('production')).toBe(true);
    });

    it('returns false for both keys when NODE_ENV is test', () => {
      vi.stubEnv('NODE_ENV', 'test');

      expect([
        environment.is('development'),
        environment.is('production')
      ]).toEqual([false, false]);
    });

    it('reads NODE_ENV at call time rather than import time', () => {
      vi.stubEnv('NODE_ENV', 'production');
      const before = environment.is('production');
      vi.stubEnv('NODE_ENV', 'development');

      expect([before, environment.is('production')]).toEqual([true, false]);
    });
  });

  describe('appUrl', () => {
    it('returns NEXT_PUBLIC_APP_URL when it is set', () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://giveaway.dog');

      expect(environment.appUrl()).toBe('https://giveaway.dog');
    });

    it('falls back to localhost when NEXT_PUBLIC_APP_URL is unset', () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', undefined);

      expect(environment.appUrl()).toBe('http://localhost:3000');
    });

    it('falls back to localhost when NEXT_PUBLIC_APP_URL is empty', () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', '');

      expect(environment.appUrl()).toBe('http://localhost:3000');
    });
  });

  describe('authUrl', () => {
    it('returns NEXTAUTH_URL outside a preview', () => {
      vi.stubEnv('VERCEL_ENV', 'production');
      vi.stubEnv('VERCEL_URL', 'giveaway-abc.vercel.app');
      vi.stubEnv('NEXTAUTH_URL', 'https://giveaway.dog');

      expect(environment.authUrl()).toBe('https://giveaway.dog');
    });

    it('returns the deployment url on a preview', () => {
      vi.stubEnv('VERCEL_ENV', 'preview');
      vi.stubEnv('VERCEL_URL', 'giveaway-abc.vercel.app');
      vi.stubEnv('NEXTAUTH_URL', undefined);

      expect(environment.authUrl()).toBe('https://giveaway-abc.vercel.app');
    });

    it('ignores NEXTAUTH_URL on a preview', () => {
      vi.stubEnv('VERCEL_ENV', 'preview');
      vi.stubEnv('VERCEL_URL', 'giveaway-abc.vercel.app');
      vi.stubEnv('NEXTAUTH_URL', 'https://giveaway.dog');

      expect(environment.authUrl()).toBe('https://giveaway-abc.vercel.app');
    });

    it('returns NEXTAUTH_URL on a preview without VERCEL_URL', () => {
      vi.stubEnv('VERCEL_ENV', 'preview');
      vi.stubEnv('VERCEL_URL', '');
      vi.stubEnv('NEXTAUTH_URL', 'https://giveaway.dog');

      expect(environment.authUrl()).toBe('https://giveaway.dog');
    });

    it('returns undefined when no url is set', () => {
      vi.stubEnv('VERCEL_ENV', undefined);
      vi.stubEnv('VERCEL_URL', undefined);
      vi.stubEnv('NEXTAUTH_URL', undefined);

      expect(environment.authUrl()).toBeUndefined();
    });
  });
});
