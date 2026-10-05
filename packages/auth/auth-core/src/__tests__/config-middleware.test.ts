import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { Session } from 'next-auth';
import { authConfigMiddleware } from '../config-middleware';
import { prismaMock } from '@giveaway/testing-mocks/prisma';
import { createSession } from '@giveaway/testing-mocks/session';

const { logger, adapter, callbacks } = authConfigMiddleware;

type AuthorizedArgs = Parameters<typeof callbacks.authorized>[0];
type JwtArgs = Parameters<typeof callbacks.jwt>[0];
type SessionArgs = Parameters<typeof callbacks.session>[0];

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

    it('looks the user up by email with findFirst', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await adapter.getUserByEmail('a@example.com');

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'a@example.com' }
      });
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

      it('allows an onboarded host on the host dashboard', () => {
        expect(authorize(local('/app/giveaways'), host)).toBe(true);
      });

      it('allows an onboarded participant on the account page', () => {
        expect(authorize(local('/account'), participant)).toBe(true);
      });
    });

    describe('onboarding', () => {
      it.each(['/account', '/app', '/browse', '/pickers/123'])(
        'redirects users who are not onboarded from %s to onboarding',
        (path) => {
          expectRedirect(
            authorize(local(path), notOnboarded),
            local('/onboarding')
          );
        }
      );

      it('does not redirect when the onboarded flag is undefined', () => {
        expect(authorize(local('/browse'), { onboarded: undefined })).toBe(
          true
        );
      });

      it('allows users who are not onboarded on the onboarding page', () => {
        expect(authorize(local('/onboarding'), notOnboarded)).toBe(true);
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

      it('treats any path starting with /app as the host dashboard', () => {
        expectRedirect(authorize(local('/apple'), participant), local('/'));
      });
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
      callbacks.jwt({ token: {}, account: null, ...args } as JwtArgs);

    it('copies the user id onto the token', async () => {
      const token = await jwt({ user: { id: 'u-1' } });

      expect(token).toEqual({ id: 'u-1' });
    });

    it('does not overwrite the token id when the user has no id', async () => {
      const token = await jwt({
        token: { id: 'existing' },
        user: { id: null }
      });

      expect(token).toEqual({ id: 'existing' });
    });

    it('copies the account provider onto the token', async () => {
      const token = await jwt({
        token: { id: 'u-1' },
        account: { provider: 'discord' }
      });

      expect(token).toEqual({ id: 'u-1', provider: 'discord' });
    });

    it('returns the same token object it was given', async () => {
      const original = { id: 'u-1' };

      expect(await jwt({ token: original })).toBe(original);
    });

    it.each(['signIn', 'update'])(
      'loads profile fields from the database on %s',
      async (trigger) => {
        prismaMock.user.findUnique.mockResolvedValue({
          onboarded: true,
          accountType: 'HOST',
          username: 'host-user'
        });

        const token = await jwt({ token: { id: 'u-1' }, trigger });

        expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'u-1' },
          select: { onboarded: true, accountType: true, username: true }
        });
        expect(token).toEqual({
          id: 'u-1',
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

      const token = await jwt({ token: { id: 'u-1' }, trigger: 'update' });

      expect(token).toEqual({ id: 'u-1' });
    });

    it('skips the lookup when the token has no id', async () => {
      await jwt({ trigger: 'signIn' });

      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('skips the lookup for other triggers', async () => {
      await jwt({ token: { id: 'u-1' }, trigger: 'signUp' });

      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('skips the lookup when there is no trigger', async () => {
      await jwt({ token: { id: 'u-1' } });

      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
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
