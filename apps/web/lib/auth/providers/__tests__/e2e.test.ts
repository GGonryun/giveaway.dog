import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { E2E_USER_EMAIL, newE2eProviders } from '../e2e';
import { prismaMock } from '@/test/prisma';

vi.mock('next-auth/providers/credentials', () => ({
  default: <T>(config: T) => config
}));

const SECRET = 'e2e-secret-with-at-least-32-chars';

const authorize = (credentials: Partial<Record<'secret', unknown>>) => {
  const [provider] = newE2eProviders();
  return provider.authorize(
    credentials,
    new Request('https://preview.giveaway.dog/api/auth/callback/e2e')
  );
};

beforeEach(() => {
  vi.stubEnv('E2E_LOGIN_SECRET', SECRET);
  vi.stubEnv('VERCEL_ENV', 'preview');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('newE2eProviders', () => {
  describe('availability', () => {
    it('adds the e2e credentials provider on preview deployments', () => {
      expect(newE2eProviders()).toEqual([
        expect.objectContaining({
          id: 'e2e',
          name: 'E2E',
          credentials: { secret: { label: 'Secret', type: 'password' } }
        })
      ]);
    });

    it('adds the provider to the local development server', () => {
      vi.stubEnv('VERCEL_ENV', undefined);
      vi.stubEnv('NODE_ENV', 'development');

      expect(newE2eProviders()).toHaveLength(1);
    });

    it('adds no provider on production deployments', () => {
      vi.stubEnv('VERCEL_ENV', 'production');

      expect(newE2eProviders()).toEqual([]);
    });

    it('adds no provider to a production build outside of Vercel', () => {
      vi.stubEnv('VERCEL_ENV', undefined);
      vi.stubEnv('NODE_ENV', 'production');

      expect(newE2eProviders()).toEqual([]);
    });

    it('adds no provider when the environment is unknown', () => {
      vi.stubEnv('VERCEL_ENV', undefined);

      expect(newE2eProviders()).toEqual([]);
    });

    it('adds no provider when the secret is not set', () => {
      vi.stubEnv('E2E_LOGIN_SECRET', undefined);

      expect(newE2eProviders()).toEqual([]);
    });

    it('adds no provider when the secret is shorter than 32 characters', () => {
      vi.stubEnv('E2E_LOGIN_SECRET', 'a'.repeat(31));

      expect(newE2eProviders()).toEqual([]);
    });
  });

  describe('authorize', () => {
    it('signs in the e2e host user with the secret', async () => {
      const user = { id: 'user-1', email: E2E_USER_EMAIL };
      prismaMock.user.upsert.mockResolvedValue(user);

      expect(await authorize({ secret: SECRET })).toBe(user);
      expect(prismaMock.user.upsert).toHaveBeenCalledWith({
        where: { email: 'e2e-host@example.com' },
        update: { accountType: 'HOST', onboarded: true },
        create: {
          email: 'e2e-host@example.com',
          emailVerified: expect.any(Date),
          name: 'E2E Host',
          accountType: 'HOST',
          onboarded: true
        }
      });
    });

    it('rejects a wrong secret', async () => {
      expect(await authorize({ secret: `${SECRET.slice(0, -1)}x` })).toBeNull();
      expect(prismaMock.user.upsert).not.toHaveBeenCalled();
    });

    it('rejects a secret of a different length', async () => {
      expect(await authorize({ secret: `${SECRET}x` })).toBeNull();
      expect(prismaMock.user.upsert).not.toHaveBeenCalled();
    });

    it('rejects a missing secret', async () => {
      expect(await authorize({})).toBeNull();
      expect(prismaMock.user.upsert).not.toHaveBeenCalled();
    });

    it('rejects a secret that is not a string', async () => {
      expect(await authorize({ secret: [SECRET] })).toBeNull();
      expect(prismaMock.user.upsert).not.toHaveBeenCalled();
    });
  });
});
