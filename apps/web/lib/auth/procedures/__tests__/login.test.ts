import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IdentityProvider } from '@prisma/client';
import login from '../login';
import { signIn as signInSession } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

type LoginInput = Parameters<typeof login>[0];

const authErrors = vi.hoisted(() => {
  class AuthError extends Error {
    type: string;
    constructor(message?: string) {
      super(message);
      this.type =
        (this.constructor as unknown as { type?: string }).type ?? 'AuthError';
    }
  }
  class CredentialsSignin extends AuthError {
    static type = 'CredentialsSignin';
  }
  return { AuthError, CredentialsSignin };
});

const { AuthError, CredentialsSignin } = authErrors;

const mocks = vi.hoisted(() => {
  const redirectError = (url: string) =>
    Object.assign(new Error('NEXT_REDIRECT'), {
      digest: `NEXT_REDIRECT;replace;${url};307;`
    });
  return {
    redirectError,
    signIn: vi.fn(),
    redirect: vi.fn((url: string) => {
      throw redirectError(url);
    })
  };
});

vi.mock('@/lib/auth/config', () => ({
  signIn: mocks.signIn,
  signOut: vi.fn(),
  auth: vi.fn(),
  handlers: {}
}));

vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

vi.mock('next-auth', () => authErrors);

const portal = (params: Record<string, string> = {}) =>
  `/portal?${new URLSearchParams(params).toString()}`;

const run = (input: Partial<LoginInput>) =>
  login({ returnTo: '/back', ...input } as LoginInput);

beforeEach(() => {
  mocks.signIn.mockReset();
  mocks.signIn.mockResolvedValue(undefined);
  mocks.redirect.mockClear();
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('login', () => {
  describe('input validation', () => {
    it('rejects input without returnTo', async () => {
      const result = await login({} as LoginInput);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(mocks.signIn).not.toHaveBeenCalled();
    });

    it('rejects an unknown provider', async () => {
      const result = await run({
        provider: 'MYSPACE' as unknown as IdentityProvider
      });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: [\s\S]*provider/
      );
      expect(mocks.signIn).not.toHaveBeenCalled();
    });

    it('rejects a missing provider as unsupported', async () => {
      const result = await run({});

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'Unsupported provider unknown'
      );
      expect(mocks.signIn).not.toHaveBeenCalled();
    });
  });

  describe('oauth providers', () => {
    it.each([
      [IdentityProvider.TWITTER, 'twitter'],
      [IdentityProvider.GOOGLE, 'google'],
      [IdentityProvider.DISCORD, 'discord'],
      [IdentityProvider.TWITCH, 'twitch'],
      [IdentityProvider.STEAM, 'steam'],
      [IdentityProvider.KICK, 'kick'],
      [IdentityProvider.TIKTOK, 'tiktok'],
      [IdentityProvider.VELORA, 'velora'],
      [IdentityProvider.LINKEDIN, 'linkedin']
    ])(
      'signs in with %s through the portal',
      async (provider, authProvider) => {
        const result = await run({ provider });

        expect(result).toEqual({ ok: true, data: undefined });
        expect(mocks.signIn).toHaveBeenCalledWith(authProvider, {
          redirectTo: portal({ provider: authProvider })
        });
      }
    );

    it('forwards redirectTo, email, revalidate and provider to the portal in order', async () => {
      await run({
        provider: IdentityProvider.GOOGLE,
        redirectTo: '/app?tab=1',
        email: 'a@example.com',
        revalidate: 'user-tag'
      });

      expect(mocks.signIn).toHaveBeenCalledWith('google', {
        redirectTo:
          '/portal?redirectTo=%2Fapp%3Ftab%3D1&email=a%40example.com&revalidate=user-tag&provider=google'
      });
    });

    it('omits empty optional values from the portal url', async () => {
      await run({
        provider: IdentityProvider.DISCORD,
        redirectTo: '',
        email: '',
        revalidate: ''
      });

      expect(mocks.signIn).toHaveBeenCalledWith('discord', {
        redirectTo: '/portal?provider=discord'
      });
    });

    it('does not depend on the caller being signed in', async () => {
      signInSession();

      const result = await run({ provider: IdentityProvider.TWITTER });

      expectOk(result);
    });

    it('logs the provider and email being used', async () => {
      await run({ provider: IdentityProvider.GOOGLE, email: 'a@example.com' });

      expect(console.info).toHaveBeenCalledWith(
        'Initiating sign-in with provider:',
        'GOOGLE',
        'and email:',
        'a@example.com'
      );
    });
  });

  describe('email provider', () => {
    it('signs in with the email and portal redirect', async () => {
      await run({ provider: IdentityProvider.EMAIL, email: 'e@example.com' });

      expect(mocks.signIn).toHaveBeenCalledWith('email', {
        email: 'e@example.com',
        redirectTo: portal({ email: 'e@example.com', provider: 'email' })
      });
    });

    it('passes an undefined email when none is given', async () => {
      await run({ provider: IdentityProvider.EMAIL });

      expect(mocks.signIn).toHaveBeenCalledWith('email', {
        email: undefined,
        redirectTo: portal({ provider: 'email' })
      });
    });
  });

  describe('anonymous provider', () => {
    it('signs in anonymously through the portal', async () => {
      await run({ provider: IdentityProvider.ANONYMOUS, redirectTo: '/g/1' });

      expect(mocks.signIn).toHaveBeenCalledWith('anonymous', {
        redirectTo: portal({ redirectTo: '/g/1', provider: 'anonymous' })
      });
    });
  });

  describe('instagram provider', () => {
    it('requires a profile url', async () => {
      const result = await run({ provider: IdentityProvider.INSTAGRAM });

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        'Instagram profile URL is required.'
      );
      expect(mocks.redirect).not.toHaveBeenCalled();
    });

    it('treats an empty profile url as missing', async () => {
      const result = await run({
        provider: IdentityProvider.INSTAGRAM,
        instagramProfileUrl: ''
      });

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        'Instagram profile URL is required.'
      );
    });

    it('rejects a url that is not a profile', async () => {
      const result = await run({
        provider: IdentityProvider.INSTAGRAM,
        instagramProfileUrl: 'https://instagram.com/p/abc'
      });

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'Must be a valid Instagram profile URL (e.g., https://instagram.com/username)'
      );
    });

    it('redirects to the instagram link route with the normalized profile', async () => {
      await expect(
        run({
          provider: IdentityProvider.INSTAGRAM,
          instagramProfileUrl: 'https://www.Instagram.com/The.User/',
          redirectTo: '/done'
        })
      ).rejects.toMatchObject({ message: 'NEXT_REDIRECT' });

      const params = new URLSearchParams({
        profileUrl: 'https://instagram.com/the.user',
        username: 'the.user',
        redirectTo: portal({ redirectTo: '/done', provider: 'instagram' })
      });
      expect(mocks.redirect).toHaveBeenCalledWith(
        `/api/instagram/user/link?${params.toString()}`
      );
      expect(mocks.signIn).not.toHaveBeenCalled();
    });
  });

  describe('facebook provider', () => {
    it('requires a profile url', async () => {
      const result = await run({ provider: IdentityProvider.FACEBOOK });

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        'Facebook profile URL is required.'
      );
    });

    it('rejects an invalid profile url', async () => {
      const result = await run({
        provider: IdentityProvider.FACEBOOK,
        facebookProfileUrl: 'https://fb.com/someone'
      });

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'Must be a valid Facebook profile URL'
      );
    });

    it('redirects to the facebook link route with the identifier', async () => {
      await expect(
        run({
          provider: IdentityProvider.FACEBOOK,
          facebookProfileUrl: 'https://www.facebook.com/profile.php?id=42'
        })
      ).rejects.toMatchObject({ message: 'NEXT_REDIRECT' });

      const params = new URLSearchParams({
        profileUrl: 'https://facebook.com/profile.php?id=42',
        identifier: '42',
        redirectTo: portal({ provider: 'facebook' })
      });
      expect(mocks.redirect).toHaveBeenCalledWith(
        `/api/facebook/user/link?${params.toString()}`
      );
    });

    it('lowercases a username identifier', async () => {
      await expect(
        run({
          provider: IdentityProvider.FACEBOOK,
          facebookProfileUrl: 'facebook.com/Jane.Doe'
        })
      ).rejects.toMatchObject({ message: 'NEXT_REDIRECT' });

      const [url] = mocks.redirect.mock.calls[0];
      const params = new URLSearchParams(url.split('?').slice(1).join('?'));
      expect(params.get('profileUrl')).toBe('https://facebook.com/jane.doe');
      expect(params.get('identifier')).toBe('jane.doe');
    });
  });

  describe('bluesky provider', () => {
    it('requires a handle', async () => {
      const result = await run({ provider: IdentityProvider.BLUESKY });

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        'Bluesky handle is required.'
      );
    });

    it('rejects an invalid handle', async () => {
      const result = await run({
        provider: IdentityProvider.BLUESKY,
        blueskyHandle: '@alice'
      });

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'Invalid Bluesky handle format. Must be a valid domain (e.g., username.bsky.social)'
      );
    });

    it('redirects to the bluesky authorize route with handle, returnTo and redirectTo', async () => {
      await expect(
        run({
          provider: IdentityProvider.BLUESKY,
          blueskyHandle: 'alice.bsky.social',
          returnTo: '/giveaways/1'
        })
      ).rejects.toMatchObject({ message: 'NEXT_REDIRECT' });

      const params = new URLSearchParams({
        handle: 'alice.bsky.social',
        returnTo: '/giveaways/1',
        redirectTo: portal({ provider: 'bluesky' })
      });
      expect(mocks.redirect).toHaveBeenCalledWith(
        `/api/bluesky/user/authorize?${params.toString()}`
      );
    });

    it('passes the handle to the authorize route without changing its case', async () => {
      await expect(
        run({
          provider: IdentityProvider.BLUESKY,
          blueskyHandle: 'Alice.Bsky.Social'
        })
      ).rejects.toMatchObject({ message: 'NEXT_REDIRECT' });

      const [url] = mocks.redirect.mock.calls[0];
      const params = new URLSearchParams(url.split('?').slice(1).join('?'));
      expect(params.get('handle')).toBe('Alice.Bsky.Social');
    });

    it('omits an empty returnTo from the authorize route', async () => {
      await expect(
        run({
          provider: IdentityProvider.BLUESKY,
          blueskyHandle: 'alice.bsky.social',
          returnTo: ''
        })
      ).rejects.toMatchObject({ message: 'NEXT_REDIRECT' });

      const params = new URLSearchParams({
        handle: 'alice.bsky.social',
        redirectTo: portal({ provider: 'bluesky' })
      });
      expect(mocks.redirect).toHaveBeenCalledWith(
        `/api/bluesky/user/authorize?${params.toString()}`
      );
    });
  });

  describe('youtube provider', () => {
    it('is not implemented', async () => {
      const result = await run({ provider: IdentityProvider.YOUTUBE });

      expect(expectFailure(result, 'NOT_IMPLEMENTED').message).toBe(
        'YouTube login is not yet implemented.'
      );
      expect(mocks.signIn).not.toHaveBeenCalled();
    });
  });

  describe('when signIn fails', () => {
    it('maps a credentials sign in error to BAD_REQUEST', async () => {
      mocks.signIn.mockRejectedValue(new CredentialsSignin());

      const result = await run({ provider: IdentityProvider.ANONYMOUS });

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        'Invalid credentials. Please try again.'
      );
    });

    it('maps other auth errors to INTERNAL_SERVER_ERROR with their message', async () => {
      mocks.signIn.mockRejectedValue(new AuthError('Provider exploded'));

      const result = await run({ provider: IdentityProvider.GOOGLE });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Provider exploded'
      );
    });

    it('uses a default message for an auth error without a message', async () => {
      mocks.signIn.mockRejectedValue(new AuthError());

      const result = await run({ provider: IdentityProvider.GOOGLE });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Sign in failed. Please try again.'
      );
    });

    it('does not map a non-auth error that carries a credentials type', async () => {
      mocks.signIn.mockRejectedValue(
        Object.assign(new Error('look-alike'), { type: 'CredentialsSignin' })
      );

      const result = await run({ provider: IdentityProvider.GOOGLE });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'look-alike'
      );
    });

    it('maps a non-auth error to INTERNAL_SERVER_ERROR with its message', async () => {
      mocks.signIn.mockRejectedValue(new Error('socket hang up'));

      const result = await run({ provider: IdentityProvider.GOOGLE });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'socket hang up'
      );
    });

    it('re-throws the redirect thrown by a successful sign in', async () => {
      const redirect = mocks.redirectError('https://accounts.google.com/o');
      mocks.signIn.mockRejectedValue(redirect);

      await expect(run({ provider: IdentityProvider.GOOGLE })).rejects.toBe(
        redirect
      );
    });
  });
});
