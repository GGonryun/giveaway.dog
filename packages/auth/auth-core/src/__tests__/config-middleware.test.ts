import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { Session } from 'next-auth';
import { authConfigMiddleware } from '../config-middleware';
import { prismaMock } from '@giveaway/testing-mocks/prisma';
import { createSession } from '@giveaway/testing-mocks/session';

const redis = vi.hoisted(() => ({ mget: vi.fn(), set: vi.fn() }));

vi.mock('@giveaway/cache/redis', () => ({ redis }));

const { logger, adapter, callbacks, events } = authConfigMiddleware;

type AuthorizedArgs = Parameters<typeof callbacks.authorized>[0];
type JwtArgs = Parameters<typeof callbacks.jwt>[0];
type SessionArgs = Parameters<typeof callbacks.session>[0];
type SignOutArgs = Parameters<typeof events.signOut>[0];

const authorize = (url: string, user: Partial<Session['user']> | null = null) =>
  callbacks.authorized({
    auth: user ? createSession(user) : null,
    request: new NextRequest(url)
  } as AuthorizedArgs);

const local = (path: string) => `http://localhost:3000${path}`;

const expectRedirect = (result: unknown, location: string) => {
  expect(result).toBeInstanceOf(Response);
  const response = result as Response;
  expect(response.status).toBe(302);
  expect(response.headers.get('location')).toBe(location);
};

const host = { onboarded: true, accountType: 'HOST' as const };
const participant = { onboarded: true, accountType: 'PARTICIPANT' as const };
const notOnboarded = { onboarded: false, accountType: 'HOST' as const };

beforeEach(() => {
  redis.mget.mockReset();
  redis.set.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'debug').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('authConfigMiddleware', () => {
  describe('static configuration', () => {
    it('routes sign in, sign out, errors and verification to the auth pages', () => {
      expect(authConfigMiddleware.pages).toEqual({
        signIn: '/login',
        signOut: '/logout',
        error: '/login',
        verifyRequest: '/login?verify=true'
      });
    });

    it('uses the jwt session strategy', () => {
      expect(authConfigMiddleware.session).toEqual({ strategy: 'jwt' });
    });

    it('has no providers', () => {
      expect(authConfigMiddleware.providers).toEqual([]);
    });
  });

  describe('logger', () => {
    it('suppresses the steam missing authorization code callback error', () => {
      logger.error({
        type: 'CallbackRouteError',
        cause: {
          provider: 'steam',
          err: { message: 'TypeError: no authorization code in response' }
        }
      });

      expect(console.error).not.toHaveBeenCalled();
    });

    it('logs other steam callback errors as formatted json', () => {
      const error = {
        type: 'CallbackRouteError',
        cause: { provider: 'steam', err: { message: 'invalid state' } }
      };

      logger.error(error);

      expect(console.error).toHaveBeenCalledWith(
        '[NextAuth Error]',
        JSON.stringify(error, null, 2)
      );
    });

    it('logs the missing authorization code error for other providers', () => {
      const error = {
        type: 'CallbackRouteError',
        cause: { provider: 'google', err: { message: 'no authorization code' } }
      };

      logger.error(error);

      expect(console.error).toHaveBeenCalledWith(
        '[NextAuth Error]',
        JSON.stringify(error, null, 2)
      );
    });

    it('logs steam errors of a different type', () => {
      const error = {
        type: 'SignInError',
        cause: { provider: 'steam', err: { message: 'no authorization code' } }
      };

      logger.error(error);

      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('logs a steam callback error whose cause has no message', () => {
      logger.error({
        type: 'CallbackRouteError',
        cause: { provider: 'steam', err: {} }
      });

      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('throws when a steam callback error has no underlying err', () => {
      expect(() =>
        logger.error({
          type: 'CallbackRouteError',
          cause: { provider: 'steam' }
        })
      ).toThrow(TypeError);
    });

    it('logs a null error', () => {
      logger.error(null);

      expect(console.error).toHaveBeenCalledWith('[NextAuth Error]', 'null');
    });

    it('logs warnings with a prefix', () => {
      logger.warn('debug-enabled');

      expect(console.warn).toHaveBeenCalledWith(
        '[NextAuth Warn]',
        'debug-enabled'
      );
    });

    it('logs debug messages with their metadata', () => {
      logger.debug('adapter_getUser', { args: ['id'] });

      expect(console.debug).toHaveBeenCalledWith(
        '[NextAuth Debug]',
        'adapter_getUser',
        { args: ['id'] }
      );
    });
  });

  describe('adapter', () => {
    it('returns null without querying for an empty email', async () => {
      const result = await adapter.getUserByEmail('');

      expect(result).toBeNull();
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });

    it('[LINK-001] looks up only a user that has verified the email', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await adapter.getUserByEmail('a@example.com');

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'a@example.com', emailVerified: { not: null } }
      });
    });

    it('[LINK-001] takes the email from a user that has not verified it before creating the new user', async () => {
      const created = {
        id: 'u-2',
        email: 'a@example.com',
        emailVerified: null
      };
      prismaMock.user.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.user.create.mockResolvedValue(created);

      const user = await adapter.createUser?.({
        id: 'ignored',
        email: 'a@example.com',
        emailVerified: null
      });

      expect(user).toEqual(created);
      expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
        where: { email: 'a@example.com', emailVerified: null },
        data: { email: null }
      });
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: { email: 'a@example.com', emailVerified: null }
      });
      expect(
        prismaMock.user.updateMany.mock.invocationCallOrder[0]
      ).toBeLessThan(prismaMock.user.create.mock.invocationCallOrder[0]);
    });

    it('creates a user without an email without releasing any address', async () => {
      prismaMock.user.create.mockResolvedValue({ id: 'u-2', email: null });

      await adapter.createUser?.({
        id: 'ignored',
        email: '',
        emailVerified: null
      });

      expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
      expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
    });

    it('returns the user when it has an email', async () => {
      const user = { id: 'u-1', email: 'a@example.com', name: 'A' };
      prismaMock.user.findFirst.mockResolvedValue(user);

      expect(await adapter.getUserByEmail('a@example.com')).toEqual(user);
    });

    it('returns null when no user matches', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      expect(await adapter.getUserByEmail('a@example.com')).toBeNull();
    });

    it('returns null when the matching user has no email', async () => {
      prismaMock.user.findFirst.mockResolvedValue({ id: 'u-1', email: null });

      expect(await adapter.getUserByEmail('a@example.com')).toBeNull();
    });

    it('keeps the prisma adapter methods bound to the app prisma client', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'u-1' });

      await adapter.getUser?.('u-1');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'u-1' }
      });
    });
  });

  describe('callbacks.authorized', () => {
    describe('logout route', () => {
      it('redirects signed-out visitors home', () => {
        expectRedirect(authorize(local('/logout')), local('/'));
      });

      it('allows signed-in users', () => {
        expect(authorize(local('/logout'), host)).toBe(true);
      });
    });

    describe('login route', () => {
      it('redirects signed-in users home', () => {
        expectRedirect(authorize(local('/login'), participant), local('/'));
      });

      it('allows signed-out visitors', () => {
        expect(authorize(local('/login'))).toBe(true);
      });

      it('allows signed-out visitors on nested login paths', () => {
        expect(authorize(local('/login/email?verify=true'))).toBe(true);
      });

      it('redirects using the request origin', () => {
        expectRedirect(
          authorize('https://giveaway.dog/login', participant),
          'https://giveaway.dog/'
        );
      });
    });

    describe('sensitive routes', () => {
      it.each(['/app', '/app/giveaways', '/account', '/account/settings'])(
        'denies signed-out visitors on %s',
        (path) => {
          expect(authorize(local(path))).toBe(false);
        }
      );

      it('[ROUTE-008] denies signed-out visitors on the onboarding page', () => {
        expect(authorize(local('/onboarding'))).toBe(false);
      });

      it('allows an onboarded host on the host dashboard', () => {
        expect(authorize(local('/app/giveaways'), host)).toBe(true);
      });

      it('allows an onboarded participant on the account page', () => {
        expect(authorize(local('/account'), participant)).toBe(true);
      });
    });

    describe('onboarding', () => {
      it.each(['/app', '/browse'])(
        'redirects users who are not onboarded from %s to onboarding',
        (path) => {
          expectRedirect(
            authorize(local(path), notOnboarded),
            local('/onboarding')
          );
        }
      );

      it.each([
        ['/account', '%2Faccount'],
        ['/app/team/sweepstakes', '%2Fapp%2Fteam%2Fsweepstakes']
      ])(
        'redirects users who are not onboarded from %s to onboarding and back',
        (path, redirectTo) => {
          expectRedirect(
            authorize(local(path), notOnboarded),
            local(`/onboarding?redirectTo=${redirectTo}`)
          );
        }
      );

      it.each(['/pickers/x', '/pickers/x/abc'])(
        '[ROUTE-006] lets a user who is not onboarded open %s',
        (path) => {
          expect(authorize(local(path), notOnboarded)).toBe(true);
        }
      );

      it('[ONBOARD-004] sends a user who is not onboarded back to the giveaway after onboarding', () => {
        expectRedirect(
          authorize(local('/browse/abc?ref=friend'), notOnboarded),
          local('/onboarding?redirectTo=%2Fbrowse%2Fabc%3Fref%3Dfriend')
        );
      });

      it('does not redirect when the onboarded flag is undefined', () => {
        expect(authorize(local('/browse'), { onboarded: undefined })).toBe(
          true
        );
      });

      it('allows users who are not onboarded on the onboarding page', () => {
        expect(authorize(local('/onboarding'), notOnboarded)).toBe(true);
      });

      it('[ONBOARD-006] sends an onboarded host from the onboarding page to the host dashboard', () => {
        expectRedirect(
          authorize(local('/onboarding?step=2'), host),
          local('/app')
        );
      });

      it('[ONBOARD-006] sends an onboarded participant from the onboarding page to browse', () => {
        expectRedirect(
          authorize(local('/onboarding'), participant),
          local('/browse')
        );
      });

      it('[ROUTE-008] denies a session without a user on the onboarding page', () => {
        const result = callbacks.authorized({
          auth: { expires: '2999-01-01T00:00:00.000Z' },
          request: new NextRequest(local('/onboarding'))
        } as unknown as AuthorizedArgs);

        expect(result).toBe(false);
      });

      it('allows users who are not onboarded on the portal', () => {
        expect(authorize(local('/portal'), notOnboarded)).toBe(true);
      });

      it('allows users who are not onboarded on unrelated pages', () => {
        expect(authorize(local('/giveaways/abc'), notOnboarded)).toBe(true);
      });

      it('allows signed-out visitors on browse', () => {
        expect(authorize(local('/browse'))).toBe(true);
      });

      it('redirects to onboarding before checking the account type', () => {
        expectRedirect(
          authorize(local('/app'), {
            onboarded: false,
            accountType: 'PARTICIPANT'
          }),
          local('/onboarding')
        );
      });
    });

    describe('host dashboard', () => {
      it('redirects onboarded participants home', () => {
        expectRedirect(authorize(local('/app'), participant), local('/'));
      });

      it('redirects users without an account type home', () => {
        expectRedirect(
          authorize(local('/app/settings'), {
            onboarded: true,
            accountType: undefined
          }),
          local('/')
        );
      });

      it.each(['/apps', '/apple-touch-icon.png', '/application'])(
        '[ROUTE-002] does not treat %s as the host dashboard',
        (path) => {
          expect(authorize(local(path))).toBe(true);
          expect(authorize(local(path), participant)).toBe(true);
          expect(authorize(local(path), notOnboarded)).toBe(true);
        }
      );
    });

    it.each([
      '/accounts',
      '/browser',
      '/login-help',
      '/logouts',
      '/onboarding-tips',
      '/portals'
    ])('matches %s by its whole first segment, not as a prefix', (path) => {
      expect(authorize(local(path))).toBe(true);
      expect(authorize(local(path), notOnboarded)).toBe(true);
      expect(authorize(local(path), host)).toBe(true);
    });

    it('allows everyone on public pages', () => {
      expect(authorize(local('/'))).toBe(true);
      expect(authorize(local('/'), participant)).toBe(true);
    });

    it('treats a session without a user as signed out', () => {
      const result = callbacks.authorized({
        auth: { expires: '2999-01-01T00:00:00.000Z' },
        request: new NextRequest(local('/app'))
      } as unknown as AuthorizedArgs);

      expect(result).toBe(false);
    });
  });

  describe('callbacks.jwt', () => {
    const jwt = (args: Record<string, unknown>) =>
      callbacks.jwt({
        token: { sid: 'session-1' },
        account: null,
        ...args
      } as JwtArgs);

    beforeEach(() => {
      redis.mget.mockResolvedValue([null, null]);
    });

    it.each(['signIn', 'signUp'])(
      'gives a new session id to a token on %s',
      async (trigger) => {
        const token = await jwt({ user: { id: 'u-1' }, trigger });

        expect(token?.sid).toEqual(expect.any(String));
        expect(token?.sid).not.toBe('session-1');
        expect(redis.mget).not.toHaveBeenCalled();
      }
    );

    it('keeps the session id of a token that is not revoked', async () => {
      const token = await jwt({ token: { id: 'u-1', sid: 'session-1' } });

      expect(redis.mget).toHaveBeenCalledExactlyOnceWith([
        'auth:revoked-session:session-1',
        'auth:revoked-user:u-1'
      ]);
      expect(token).toEqual({ id: 'u-1', sid: 'session-1' });
    });

    it('checks only the session of a token without a user id', async () => {
      redis.mget.mockResolvedValue([null]);

      const token = await jwt({ token: { sid: 'session-1' } });

      expect(redis.mget).toHaveBeenCalledExactlyOnceWith([
        'auth:revoked-session:session-1'
      ]);
      expect(token).toEqual({ sid: 'session-1' });
    });

    it('gives a session id to a token that has none', async () => {
      const token = await jwt({ token: { id: 'u-1' } });

      expect(redis.mget).not.toHaveBeenCalled();
      expect(token).toEqual({ id: 'u-1', sid: expect.any(String) });
    });

    it('ends a session that was signed out', async () => {
      redis.mget.mockResolvedValue([1, null]);

      const token = await jwt({ token: { id: 'u-1', sid: 'session-1' } });

      expect(token).toBeNull();
    });

    it('ends a signed out session on update too', async () => {
      redis.mget.mockResolvedValue([1, null]);

      const token = await jwt({
        token: { id: 'u-1', sid: 'session-1' },
        trigger: 'update'
      });

      expect(token).toBeNull();
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('[AUTH-014] ends a session that signed in before its user was revoked', async () => {
      redis.mget.mockResolvedValue([null, 2_000]);

      const token = await jwt({
        token: { id: 'u-1', sid: 'session-1', signedInAt: 1_999 }
      });

      expect(token).toBeNull();
    });

    it('[AUTH-014] ends a session that signed in when its user was revoked', async () => {
      redis.mget.mockResolvedValue([null, 2_000]);

      const token = await jwt({
        token: { id: 'u-1', sid: 'session-1', signedInAt: 2_000 }
      });

      expect(token).toBeNull();
    });

    it('[AUTH-014] ends a session without a sign-in time when its user was revoked', async () => {
      redis.mget.mockResolvedValue([null, 2_000]);

      const token = await jwt({ token: { id: 'u-1', sid: 'session-1' } });

      expect(token).toBeNull();
    });

    it('keeps a session that signed in after its user was revoked', async () => {
      redis.mget.mockResolvedValue([null, 2_000]);

      const token = await jwt({
        token: { id: 'u-1', sid: 'session-1', signedInAt: 2_001 }
      });

      expect(token).toEqual({ id: 'u-1', sid: 'session-1', signedInAt: 2_001 });
    });

    it.each(['signIn', 'signUp'])(
      'records the sign-in time of a new session on %s',
      async (trigger) => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

        const token = await jwt({ user: { id: 'u-1' }, trigger });

        vi.useRealTimers();
        expect(token?.signedInAt).toBe(Date.parse('2026-01-01T00:00:00.000Z'));
      }
    );

    it('keeps the session when the revocation check fails', async () => {
      redis.mget.mockRejectedValue(new Error('down'));

      const token = await jwt({ token: { id: 'u-1', sid: 'session-1' } });

      expect(token).toEqual({ id: 'u-1', sid: 'session-1' });
      expect(console.warn).toHaveBeenCalledWith(
        '[auth] Failed to check the session revocation',
        expect.any(Error)
      );
    });

    it('copies the user id onto the token', async () => {
      const token = await jwt({ user: { id: 'u-1' } });

      expect(token).toEqual({ id: 'u-1', sid: 'session-1' });
    });

    it('does not overwrite the token id when the user has no id', async () => {
      const token = await jwt({
        token: { id: 'existing', sid: 'session-1' },
        user: { id: null }
      });

      expect(token).toEqual({ id: 'existing', sid: 'session-1' });
    });

    it('copies the account provider onto the token', async () => {
      const token = await jwt({
        token: { id: 'u-1', sid: 'session-1' },
        account: { provider: 'discord' }
      });

      expect(token).toEqual({
        id: 'u-1',
        sid: 'session-1',
        provider: 'discord'
      });
    });

    it('returns the same token object it was given', async () => {
      const original = { id: 'u-1', sid: 'session-1' };

      expect(await jwt({ token: original })).toBe(original);
    });

    it.each(['signIn', 'signUp', 'update'])(
      'loads profile fields from the database on %s',
      async (trigger) => {
        prismaMock.user.findUnique.mockResolvedValue({
          onboarded: true,
          accountType: 'HOST',
          username: 'host-user'
        });

        const token = await jwt({
          token: { id: 'u-1', sid: 'session-1' },
          trigger
        });

        expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'u-1' },
          select: { onboarded: true, accountType: true, username: true }
        });
        expect(token).toEqual({
          id: 'u-1',
          sid: expect.any(String),
          signedInAt: trigger === 'update' ? undefined : expect.any(Number),
          onboarded: true,
          accountType: 'HOST',
          username: 'host-user'
        });
      }
    );

    it('uses the id from the signing-in user for the lookup', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await jwt({ user: { id: 'fresh' }, trigger: 'signIn' });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'fresh' } })
      );
    });

    it('leaves the token unchanged when the user no longer exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const token = await jwt({
        token: { id: 'u-1', sid: 'session-1' },
        trigger: 'update'
      });

      expect(token).toEqual({ id: 'u-1', sid: 'session-1' });
    });

    it('skips the lookup when the token has no id', async () => {
      await jwt({ token: {}, trigger: 'signIn' });

      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it("[AUTH-006] marks a new user's first session as not onboarded", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        onboarded: false,
        accountType: 'PARTICIPANT',
        username: null
      });

      const token = await jwt({
        token: {},
        user: { id: 'new-user' },
        account: { provider: 'discord' },
        trigger: 'signUp'
      });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'new-user' } })
      );
      expect(token).toMatchObject({
        id: 'new-user',
        provider: 'discord',
        onboarded: false,
        accountType: 'PARTICIPANT',
        username: null
      });
    });

    it('skips the lookup when there is no trigger', async () => {
      await jwt({ token: { id: 'u-1' } });

      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('events.signOut', () => {
    const signOut = (message: unknown) =>
      events.signOut(message as SignOutArgs);

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const now = Date.parse('2026-01-01T00:00:00.000Z') / 1000;

    it('revokes the session until its token expires', async () => {
      await signOut({ token: { sid: 'session-1', exp: now + 600 } });

      expect(redis.set).toHaveBeenCalledExactlyOnceWith(
        'auth:revoked-session:session-1',
        1,
        { ex: 600 }
      );
    });

    it('revokes a token without an expiry for the session max age', async () => {
      await signOut({ token: { sid: 'session-1' } });

      expect(redis.set).toHaveBeenCalledWith(
        'auth:revoked-session:session-1',
        1,
        { ex: 30 * 24 * 60 * 60 }
      );
    });

    it('keeps the revocation for at least one second', async () => {
      await signOut({ token: { sid: 'session-1', exp: now - 10 } });

      expect(redis.set).toHaveBeenCalledWith(
        'auth:revoked-session:session-1',
        1,
        { ex: 1 }
      );
    });

    it.each([
      ['a token without a session id', { token: { id: 'u-1' } }],
      ['no token', { token: null }],
      ['a database session', { session: { sessionToken: 't' } }]
    ])('revokes nothing for %s', async (_, message) => {
      await signOut(message);

      expect(redis.set).not.toHaveBeenCalled();
    });

    it('logs and swallows a failed revocation', async () => {
      redis.set.mockRejectedValue(new Error('down'));

      await expect(
        signOut({ token: { sid: 'session-1', exp: now + 600 } })
      ).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalledWith(
        '[auth] Failed to revoke the session',
        expect.any(Error)
      );
    });
  });

  describe('callbacks.session', () => {
    const baseUser = {
      id: 'session-id',
      name: 'Name',
      email: 'e@example.com',
      provider: 'google',
      onboarded: false,
      accountType: 'PARTICIPANT' as const,
      username: 'session-username'
    };

    const callSession = (token: unknown, user: unknown = { ...baseUser }) =>
      callbacks.session({
        token,
        session: { user, expires: '2999-01-01T00:00:00.000Z' }
      } as unknown as SessionArgs);

    it('copies the token fields onto the session user', () => {
      const session = callSession({
        id: 'token-id',
        provider: 'discord',
        onboarded: true,
        accountType: 'HOST',
        username: 'token-username'
      });

      expect(session.user).toEqual({
        ...baseUser,
        id: 'token-id',
        provider: 'discord',
        onboarded: true,
        accountType: 'HOST',
        username: 'token-username'
      });
    });

    it('keeps the session user fields when the token lacks them', () => {
      const session = callSession({});

      expect(session.user).toEqual(baseUser);
    });

    it('keeps the session username when the token username is null', () => {
      const session = callSession({ username: null });

      expect(session.user.username).toBe('session-username');
    });

    it('keeps a false onboarded flag from the token', () => {
      const session = callSession(
        { onboarded: false },
        {
          ...baseUser,
          onboarded: true
        }
      );

      expect(session.user.onboarded).toBe(false);
    });

    it('keeps the session user fields when there is no token', () => {
      const session = callSession(undefined);

      expect(session.user).toEqual(baseUser);
    });

    it('returns a session without a user unchanged', () => {
      const original = { expires: '2999-01-01T00:00:00.000Z' };

      const session = callbacks.session({
        token: { id: 'token-id' },
        session: original
      } as unknown as SessionArgs);

      expect(session).toBe(original);
      expect(session).toEqual({ expires: '2999-01-01T00:00:00.000Z' });
    });
  });
});
