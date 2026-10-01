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
});
