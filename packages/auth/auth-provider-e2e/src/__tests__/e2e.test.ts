import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { newE2eProviders } from '../e2e';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { E2E_PERSONAS } from '@giveaway/e2e-model/personas';

vi.mock('next-auth/providers/credentials', () => ({
  default: <T>(config: T) => config
}));

const SECRET = 'e2e-secret-with-at-least-32-chars';

const E2E_EMAIL = /^e2e-[a-z0-9]+(-[a-z0-9]{4,10})?@example\.com$/;

const authorize = (
  credentials: Partial<Record<'secret' | 'persona' | 'ns' | 'email', unknown>>
) => {
  const [provider] = newE2eProviders();
  return provider.authorize(
    credentials,
    new Request('https://preview.giveaway.dog/api/auth/callback/e2e')
  );
};

const upsertedEmail = () =>
  prismaMock.user.upsert.mock.calls[0][0].where.email as string;

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
          credentials: {
            secret: { label: 'Secret', type: 'password' },
            persona: { label: 'Persona', type: 'text' },
            ns: { label: 'Namespace', type: 'text' }
          }
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

    it('adds no provider to a custom Vercel environment', () => {
      vi.stubEnv('VERCEL_TARGET_ENV', 'staging');

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

  describe('authorize the shared host', () => {
    it('signs in the e2e host user with the secret alone', async () => {
      const user = { id: 'user-1', email: 'e2e-host@example.com' };
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

    it('ignores an email credential', async () => {
      await authorize({ secret: SECRET, email: 'someone@gmail.com' });

      expect(upsertedEmail()).toBe('e2e-host@example.com');
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

  describe('authorize a persona', () => {
    it.each(E2E_PERSONAS)(
      'signs in %s with an e2e email in its namespace',
      async (persona) => {
        const user = { id: 'user-1' };
        prismaMock.user.upsert.mockResolvedValue(user);

        expect(await authorize({ secret: SECRET, persona, ns: 'abc123' })).toBe(
          user
        );
        expect(upsertedEmail()).toBe(`e2e-${persona}-abc123@example.com`);
        expect(upsertedEmail()).toMatch(E2E_EMAIL);
      }
    );

    it('resets the attributes of a host persona', async () => {
      await authorize({ secret: SECRET, persona: 'admin', ns: 'abc123' });

      expect(prismaMock.user.upsert).toHaveBeenCalledWith({
        where: { email: 'e2e-admin-abc123@example.com' },
        update: { accountType: 'HOST', onboarded: true },
        create: {
          email: 'e2e-admin-abc123@example.com',
          emailVerified: expect.any(Date),
          name: 'E2E admin',
          accountType: 'HOST',
          onboarded: true
        }
      });
    });

    it('resets a participant persona', async () => {
      await authorize({
        secret: SECRET,
        persona: 'participant2',
        ns: 'abc123'
      });

      expect(prismaMock.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { accountType: 'PARTICIPANT', onboarded: true }
        })
      );
    });

    it('resets the newbie to a participant with no username who has not finished onboarding', async () => {
      await authorize({ secret: SECRET, persona: 'newbie', ns: 'abc123' });

      expect(prismaMock.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: {
            accountType: 'PARTICIPANT',
            onboarded: false,
            username: null
          }
        })
      );
    });

    it('ignores an email credential', async () => {
      await authorize({
        secret: SECRET,
        persona: 'participant',
        ns: 'abc123',
        email: 'someone@gmail.com'
      });

      expect(upsertedEmail()).toBe('e2e-participant-abc123@example.com');
    });

    it('rejects a wrong secret with a valid persona', async () => {
      expect(
        await authorize({
          secret: `${SECRET.slice(0, -1)}x`,
          persona: 'host',
          ns: 'abc123'
        })
      ).toBeNull();
      expect(prismaMock.user.upsert).not.toHaveBeenCalled();
    });

    it.each([
      ['an unknown persona', 'owner'],
      ['an uppercase persona', 'HOST'],
      ['a persona with a space', 'host '],
      ['an empty persona', ''],
      ['an email as the persona', 'host@example.com'],
      ['a persona with a namespace in it', 'host-abc123'],
      ['an array', ['host']],
      ['an object', { persona: 'host' }],
      ['a number', 1],
      ['null', null]
    ])('rejects %s without a database call', async (_, persona) => {
      expect(
        await authorize({ secret: SECRET, persona, ns: 'abc123' })
      ).toBeNull();
      expect(prismaMock.user.upsert).not.toHaveBeenCalled();
    });

    it.each([
      ['uppercase', 'ABC123'],
      ['an at sign', 'abc@123'],
      ['a dot', 'abc.123'],
      ['a slash', 'abc/123'],
      ['a percent sign', 'abc%40'],
      ['a hyphen', 'abc-123'],
      ['whitespace', 'abc 123'],
      ['a trailing newline', 'abc123\n'],
      ['unicode', 'abcé123'],
      ['too short', 'abc'],
      ['too long', 'abcdefghijk'],
      ['empty', ''],
      ['an array', ['abc123']],
      ['an object', { ns: 'abc123' }],
      ['a number', 123456],
      ['null', null]
    ])('rejects a namespace with %s without a database call', async (_, ns) => {
      expect(await authorize({ secret: SECRET, persona: 'host', ns })).toBe(
        null
      );
      expect(prismaMock.user.upsert).not.toHaveBeenCalled();
    });

    it('rejects a persona without a namespace', async () => {
      expect(await authorize({ secret: SECRET, persona: 'host' })).toBeNull();
      expect(prismaMock.user.upsert).not.toHaveBeenCalled();
    });

    it('rejects a namespace without a persona', async () => {
      expect(await authorize({ secret: SECRET, ns: 'abc123' })).toBeNull();
      expect(prismaMock.user.upsert).not.toHaveBeenCalled();
    });
  });
});
