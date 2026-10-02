import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { UserSource } from '@prisma/client';
import { GET } from '../route';
import { prismaMock } from '@/test/prisma';
import { createSession, TEST_USER } from '@/test/session';

const m = vi.hoisted(() => {
  const getProfile = vi.fn();
  return {
    auth: vi.fn(),
    signIn: vi.fn(),
    getBlueskyClient: vi.fn(),
    callback: vi.fn(),
    getProfile,
    Agent: vi.fn(function Agent() {
      return { getProfile };
    })
  };
});

vi.mock('@/lib/auth/config', () => ({
  auth: m.auth,
  signIn: m.signIn,
  signOut: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() }
}));

vi.mock('@/lib/bluesky/bluesky-client', () => ({
  getBlueskyClient: m.getBlueskyClient
}));

vi.mock('@atproto/api', () => ({
  Agent: m.Agent
}));

const NOW = new Date('2026-01-15T12:00:00.000Z');
const DID = 'did:plc:alice';
const BLUESKY_SESSION = { did: DID, sub: DID };
const HANDLE = 'alice.bsky.social';
const ACCOUNT_KEY = {
  provider_providerAccountId: { provider: 'bluesky', providerAccountId: DID }
};

const request = (redirectCookie?: string) =>
  new NextRequest(
    'http://localhost:3000/api/bluesky/user/callback?code=code-1&state=state-1&iss=https%3A%2F%2Fbsky.social',
    {
      headers: redirectCookie
        ? { cookie: `bluesky_redirect=${redirectCookie}` }
        : {}
    }
  );

const LOGIN_TOKEN = expect.stringMatching(/^[0-9a-f]{64}$/);

const signedInToken = () =>
  (m.signIn.mock.calls[0][1] as { token: string }).token;

const redirectDigest = (url: string) => `NEXT_REDIRECT;replace;${url};307;`;

const linkedAccount = (userId: string | null) => ({
  id: 'account-1',
  provider: 'bluesky',
  providerAccountId: DID,
  userId,
  user: userId ? { id: userId } : null
});

describe('bluesky user callback GET', () => {
  let consoleWarn: ReturnType<typeof vi.spyOn>;
  let consoleInfo: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    m.auth.mockReset();
    m.auth.mockResolvedValue(null);
    m.signIn.mockReset();
    m.signIn.mockResolvedValue(undefined);
    m.callback.mockReset();
    m.callback.mockResolvedValue({ session: BLUESKY_SESSION });
    m.getBlueskyClient.mockReset();
    m.getBlueskyClient.mockResolvedValue({ callback: m.callback });
    m.getProfile.mockReset();
    m.getProfile.mockResolvedValue({
      data: {
        did: DID,
        handle: HANDLE,
        displayName: 'Alice',
        avatar: 'https://cdn.bsky.app/alice.jpg'
      }
    });
    m.Agent.mockClear();
    prismaMock.account.findUnique.mockResolvedValue(null);
    prismaMock.account.update.mockResolvedValue({ id: 'account-1' });
    prismaMock.user.update.mockResolvedValue({ id: 'user-9' });
    prismaMock.user.create.mockResolvedValue({ id: 'new-user' });
    prismaMock.verificationToken.create.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('when completing the OAuth exchange', () => {
    it('propagates a failure to create the Bluesky client before checking the session', async () => {
      const failure = new Error(
        'BLUESKY_PRIVATE_KEY environment variable is required'
      );
      m.getBlueskyClient.mockRejectedValue(failure);

      await expect(GET(request())).rejects.toBe(failure);
      expect(m.auth).not.toHaveBeenCalled();
    });

    it('propagates a failure of the OAuth callback', async () => {
      const failure = new Error('invalid_grant');
      m.callback.mockRejectedValue(failure);

      await expect(GET(request())).rejects.toBe(failure);
      expect(prismaMock.account.findUnique).not.toHaveBeenCalled();
    });

    it('passes the callback query parameters to the Bluesky client', async () => {
      await GET(request());

      const params = m.callback.mock.calls[0][0] as URLSearchParams;
      expect(params.toString()).toBe(
        'code=code-1&state=state-1&iss=https%3A%2F%2Fbsky.social'
      );
    });

    it('fetches the profile of the authorized DID', async () => {
      await GET(request());

      expect(m.Agent).toHaveBeenCalledWith(BLUESKY_SESSION);
      expect(m.getProfile).toHaveBeenCalledWith({ actor: DID });
    });

    it('logs the start of the callback for a signed-out visitor', async () => {
      await GET(request());

      expect(consoleInfo).toHaveBeenCalledWith(
        'Bluesky OAuth callback started',
        { hasSession: false, sessionUserId: undefined, redirectTo: '' }
      );
    });

    it('logs the start of the callback for a signed-in user', async () => {
      m.auth.mockResolvedValue(createSession());

      await GET(request('/app/acme')).catch(() => undefined);

      expect(consoleInfo).toHaveBeenCalledWith(
        'Bluesky OAuth callback started',
        {
          hasSession: true,
          sessionUserId: TEST_USER.id,
          redirectTo: '/app/acme'
        }
      );
    });

    it('logs the fetched profile', async () => {
      await GET(request());

      expect(consoleInfo).toHaveBeenCalledWith('Bluesky profile fetched', {
        did: DID,
        handle: HANDLE,
        displayName: 'Alice'
      });
    });

    it('looks up the Bluesky account by DID including its user', async () => {
      await GET(request());

      expect(prismaMock.account.findUnique).toHaveBeenCalledWith({
        where: ACCOUNT_KEY,
        include: { user: true }
      });
    });
  });

  describe('when the account is linked to a different signed-in user', () => {
    beforeEach(() => {
      m.auth.mockResolvedValue(createSession());
      prismaMock.account.findUnique.mockResolvedValue(
        linkedAccount('other-user')
      );
    });

    it('redirects to the stored redirect target with an already-linked error', async () => {
      await expect(GET(request('/browse/abc'))).rejects.toMatchObject({
        digest: redirectDigest(
          'http://localhost:3000/browse/abc?error=OAuthAccountAlreadyLinked'
        )
      });
    });

    it('defaults the error redirect to the account page', async () => {
      await expect(GET(request())).rejects.toMatchObject({
        digest: redirectDigest(
          'http://localhost:3000/account?error=OAuthAccountAlreadyLinked'
        )
      });
    });

    it('does not update the account or sign in', async () => {
      await GET(request()).catch(() => undefined);

      expect(prismaMock.account.update).not.toHaveBeenCalled();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
      expect(m.signIn).not.toHaveBeenCalled();
    });

    it('logs a warning with both user ids', async () => {
      await GET(request()).catch(() => undefined);

      expect(consoleWarn).toHaveBeenCalledWith(
        'Bluesky account linking failed - account already linked to different user',
        {
          blueskyHandle: HANDLE,
          blueskyDid: DID,
          existingUserId: 'other-user',
          attemptedLinkUserId: TEST_USER.id
        }
      );
    });
  });

  describe('when the account is already linked and nobody is signed in', () => {
    beforeEach(() => {
      prismaMock.account.findUnique.mockResolvedValue(linkedAccount('user-9'));
    });

    it('refreshes the account profile data', async () => {
      await GET(request());

      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: ACCOUNT_KEY,
        data: {
          label: HANDLE,
          link: `https://bsky.app/profile/${HANDLE}`,
          scope: 'atproto transition:generic',
          updatedAt: NOW
        }
      });
    });

    it('marks the linked user as a signup', async () => {
      await GET(request());

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-9' },
        data: { source: UserSource.SIGNUP }
      });
    });

    it('signs the linked user in and sends participants to browse by default', async () => {
      await GET(request());

      expect(m.signIn).toHaveBeenCalledWith('bluesky-direct', {
        token: LOGIN_TOKEN,
        redirectTo: '/browse'
      });
    });

    it('signs the linked user in with the stored redirect target', async () => {
      await GET(request('/browse/giveaway-1'));

      expect(m.signIn).toHaveBeenCalledWith('bluesky-direct', {
        token: LOGIN_TOKEN,
        redirectTo: '/browse/giveaway-1'
      });
    });

    it('stores a one minute login token for the linked user', async () => {
      await GET(request());

      expect(prismaMock.verificationToken.create).toHaveBeenCalledWith({
        data: {
          identifier: 'bluesky-direct:user-9',
          token: createHash('sha256').update(signedInToken()).digest('hex'),
          expires: new Date('2026-01-15T12:01:00.000Z')
        }
      });
    });

    it('passes the login token and not the user id to sign in', async () => {
      await GET(request());

      const options = m.signIn.mock.calls[0][1];
      expect(options).not.toHaveProperty('userId');
      expect(JSON.stringify(options)).not.toContain('user-9');
    });

    it('stores the login token before signing in', async () => {
      await GET(request());

      expect(
        prismaMock.verificationToken.create.mock.invocationCallOrder[0]
      ).toBeLessThan(m.signIn.mock.invocationCallOrder[0]);
    });

    it('does not sign in when the login token cannot be stored', async () => {
      const failure = new Error('db down');
      prismaMock.verificationToken.create.mockRejectedValue(failure);

      await expect(GET(request())).rejects.toBe(failure);
      expect(m.signIn).not.toHaveBeenCalled();
    });

    it('does not create a new user', async () => {
      await GET(request());

      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('logs the sign in with the resolved redirect target', async () => {
      await GET(request());

      expect(consoleInfo).toHaveBeenCalledWith(
        'Bluesky OAuth complete - signing in user',
        { userId: 'user-9', redirectTo: '/browse' }
      );
    });

    it('resolves to undefined when sign in returns without redirecting', async () => {
      await expect(GET(request())).resolves.toBeUndefined();
    });

    it('propagates the redirect thrown by sign in', async () => {
      const redirectError = Object.assign(new Error('NEXT_REDIRECT'), {
        digest: redirectDigest('/browse')
      });
      m.signIn.mockRejectedValue(redirectError);

      await expect(GET(request())).rejects.toBe(redirectError);
    });
  });

  describe('when the account is already linked to the signed-in user', () => {
    beforeEach(() => {
      m.auth.mockResolvedValue(createSession());
      prismaMock.account.findUnique.mockResolvedValue(
        linkedAccount(TEST_USER.id)
      );
    });

    it('reconnects the account and signs the user in again', async () => {
      await GET(request());

      expect(prismaMock.account.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ updatedAt: NOW })
        })
      );
      expect(m.signIn).toHaveBeenCalledWith('bluesky-direct', {
        token: LOGIN_TOKEN,
        redirectTo: '/browse'
      });
    });
  });

  describe('when the account has no user and someone is signed in', () => {
    beforeEach(() => {
      m.auth.mockResolvedValue(createSession());
    });

    it('links the account to the signed-in user', async () => {
      await GET(request()).catch(() => undefined);

      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: ACCOUNT_KEY,
        data: {
          userId: TEST_USER.id,
          label: HANDLE,
          link: `https://bsky.app/profile/${HANDLE}`,
          scope: 'atproto transition:generic'
        }
      });
    });

    it('links an account record whose userId is null', async () => {
      prismaMock.account.findUnique.mockResolvedValue(linkedAccount(null));

      await GET(request()).catch(() => undefined);

      expect(prismaMock.account.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: TEST_USER.id })
        })
      );
    });

    it('redirects to the account page by default', async () => {
      await expect(GET(request())).rejects.toMatchObject({
        digest: redirectDigest('/account')
      });
    });

    it('redirects to the stored redirect target', async () => {
      await expect(GET(request('/app/acme'))).rejects.toMatchObject({
        digest: redirectDigest('/app/acme')
      });
    });

    it('follows an absolute stored redirect target to another origin', async () => {
      await expect(
        GET(request('https://evil.example/phish'))
      ).rejects.toMatchObject({
        digest: redirectDigest('https://evil.example/phish')
      });
    });

    it('logs the completed link with the fallback redirect target', async () => {
      await GET(request()).catch(() => undefined);

      expect(consoleInfo).toHaveBeenCalledWith(
        'Bluesky account linking complete - redirecting',
        { userId: TEST_USER.id, redirectTo: '/account' }
      );
    });

    it('does not create a user, update the user, or sign in', async () => {
      await GET(request()).catch(() => undefined);

      expect(prismaMock.user.create).not.toHaveBeenCalled();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
      expect(m.signIn).not.toHaveBeenCalled();
    });

    it('does not create a login token', async () => {
      await GET(request()).catch(() => undefined);

      expect(prismaMock.verificationToken.create).not.toHaveBeenCalled();
    });

    it('propagates a failure to update the account', async () => {
      const failure = new Error('Record to update not found');
      prismaMock.account.update.mockRejectedValue(failure);

      await expect(GET(request())).rejects.toBe(failure);
    });
  });

  describe('when the account has no user and nobody is signed in', () => {
    it('creates a new signup user from the Bluesky profile', async () => {
      await GET(request());

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          id: expect.stringMatching(/^[a-z][a-z0-9]{23}$/),
          name: 'Alice',
          username: HANDLE,
          image: 'https://cdn.bsky.app/alice.jpg',
          source: UserSource.SIGNUP
        }
      });
    });

    it('names the user after the handle when the display name is empty', async () => {
      m.getProfile.mockResolvedValue({
        data: { did: DID, handle: HANDLE, displayName: '' }
      });

      await GET(request());

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: HANDLE, image: undefined })
      });
    });

    it('links the account to the newly created user', async () => {
      await GET(request());

      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: ACCOUNT_KEY,
        data: {
          userId: 'new-user',
          label: HANDLE,
          link: `https://bsky.app/profile/${HANDLE}`,
          scope: 'atproto transition:generic'
        }
      });
    });

    it('signs the new user in', async () => {
      await GET(request('/browse/giveaway-1'));

      expect(m.signIn).toHaveBeenCalledWith('bluesky-direct', {
        token: LOGIN_TOKEN,
        redirectTo: '/browse/giveaway-1'
      });
    });

    it('stores the login token for the new user', async () => {
      await GET(request());

      expect(prismaMock.verificationToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          identifier: 'bluesky-direct:new-user',
          token: createHash('sha256').update(signedInToken()).digest('hex')
        })
      });
    });

    it('logs the created user', async () => {
      await GET(request());

      expect(consoleInfo).toHaveBeenCalledWith('New Bluesky user created', {
        userId: 'new-user',
        handle: HANDLE,
        did: DID,
        displayName: 'Alice'
      });
    });

    it('does not mark an existing user as a signup', async () => {
      await GET(request());

      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });
});
