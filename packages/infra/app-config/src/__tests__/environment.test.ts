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
    const stubUrls = (urls: {
      app?: string;
      publicDeployment?: string;
      deployment?: string;
    }) => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', urls.app);
      vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', urls.publicDeployment);
      vi.stubEnv('VERCEL_URL', urls.deployment);
    };

    it('returns NEXT_PUBLIC_APP_URL when it is set', () => {
      stubUrls({ app: 'https://giveaway.dog' });

      expect(environment.appUrl()).toBe('https://giveaway.dog');
    });

    it('prefers NEXT_PUBLIC_APP_URL over the deployment URL', () => {
      stubUrls({
        app: 'https://www.giveaway.dog',
        publicDeployment: 'giveaway-abc123-team.vercel.app',
        deployment: 'giveaway-abc123-team.vercel.app'
      });

      expect(environment.appUrl()).toBe('https://www.giveaway.dog');
    });

    it('falls back to the deployment URL when NEXT_PUBLIC_APP_URL is unset', () => {
      stubUrls({ deployment: 'giveaway-abc123-team.vercel.app' });

      expect(environment.appUrl()).toBe(
        'https://giveaway-abc123-team.vercel.app'
      );
    });

    it('falls back to the deployment URL when NEXT_PUBLIC_APP_URL is empty', () => {
      stubUrls({ app: '', deployment: 'giveaway-abc123-team.vercel.app' });

      expect(environment.appUrl()).toBe(
        'https://giveaway-abc123-team.vercel.app'
      );
    });

    it('reads NEXT_PUBLIC_VERCEL_URL, which client code can read', () => {
      stubUrls({ publicDeployment: 'giveaway-abc123-team.vercel.app' });

      expect(environment.appUrl()).toBe(
        'https://giveaway-abc123-team.vercel.app'
      );
    });

    it('falls back to localhost when no URL is set', () => {
      stubUrls({});

      expect(environment.appUrl()).toBe('http://localhost:3000');
    });

    it('falls back to localhost when every URL is empty', () => {
      stubUrls({ app: '', publicDeployment: '', deployment: '' });

      expect(environment.appUrl()).toBe('http://localhost:3000');
    });
  });
});
