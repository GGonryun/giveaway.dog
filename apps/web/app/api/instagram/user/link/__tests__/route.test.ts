import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import { createSession, TEST_USER } from '@giveaway/testing-server/session';

const m = vi.hoisted(() => ({
  auth: vi.fn()
}));

vi.mock('@giveaway/auth-server/config', () => ({
  auth: m.auth,
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() }
}));

const NOW = new Date('2026-01-15T12:00:00.000Z');
const PROFILE_URL = 'https://instagram.com/jane_doe';

const request = (params: Record<string, string>) => {
  const url = new URL('http://localhost:3000/api/instagram/user/link');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
};

const redirectDigest = (url: string) => `NEXT_REDIRECT;replace;${url};307;`;

describe('instagram user link GET', () => {
  let consoleWarn: ReturnType<typeof vi.spyOn>;
  let consoleInfo: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    m.auth.mockReset();
    m.auth.mockResolvedValue(createSession());
    prismaMock.account.findFirst.mockResolvedValue(null);
    prismaMock.account.create.mockResolvedValue({ id: 'account-1' });
    prismaMock.account.update.mockResolvedValue({ id: 'account-1' });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('logs the start of the link request with the resolved redirect target', async () => {
    await GET(request({ profileUrl: PROFILE_URL, username: 'jane_doe' })).catch(
      () => undefined
    );

    expect(consoleInfo).toHaveBeenCalledWith('Instagram link request started', {
      username: 'jane_doe',
      redirectTo: '/account'
    });
  });

  describe('when required parameters are missing', () => {
    it('redirects to the account page with a link failure when the profile URL is missing', async () => {
      await expect(
        GET(request({ username: 'jane_doe' }))
      ).rejects.toMatchObject({
        digest: redirectDigest(
          'http://localhost:3000/account?error=instagram_link_failed'
        )
      });
    });

    it('redirects with a link failure when the username is missing', async () => {
      await expect(
        GET(request({ profileUrl: PROFILE_URL, redirectTo: '/browse' }))
      ).rejects.toMatchObject({
        digest: redirectDigest(
          'http://localhost:3000/browse?error=instagram_link_failed'
        )
      });
    });

    it('treats empty parameters as missing', async () => {
      await expect(
        GET(request({ profileUrl: '', username: '' }))
      ).rejects.toMatchObject({
        digest: redirectDigest(
          'http://localhost:3000/account?error=instagram_link_failed'
        )
      });
    });

    it('does not check the session', async () => {
      await GET(request({})).catch(() => undefined);

      expect(m.auth).not.toHaveBeenCalled();
    });

    it('logs which parameters were missing', async () => {
      await GET(request({ username: 'jane_doe' })).catch(() => undefined);

      expect(consoleWarn).toHaveBeenCalledWith(
        'Instagram link failed - missing parameters',
        { hasProfileUrl: false, hasUsername: true }
      );
    });
  });

  describe('when the user is not authenticated', () => {
    it('redirects with an authentication required error', async () => {
      m.auth.mockResolvedValue(null);

      await expect(
        GET(request({ profileUrl: PROFILE_URL, username: 'jane_doe' }))
      ).rejects.toMatchObject({
        digest: redirectDigest(
          'http://localhost:3000/account?error=Authentication+required'
        )
      });
    });

    it('redirects when the session has no user id', async () => {
      m.auth.mockResolvedValue({ user: {}, expires: '2999-01-01' });

      await expect(
        GET(
          request({
            profileUrl: PROFILE_URL,
            username: 'jane_doe',
            redirectTo: '/browse'
          })
        )
      ).rejects.toMatchObject({
        digest: redirectDigest(
          'http://localhost:3000/browse?error=Authentication+required'
        )
      });
    });

    it('logs a warning', async () => {
      m.auth.mockResolvedValue(null);

      await GET(
        request({ profileUrl: PROFILE_URL, username: 'jane_doe' })
      ).catch(() => undefined);

      expect(consoleWarn).toHaveBeenCalledWith(
        'Instagram link failed - not authenticated'
      );
    });

    it('does not query accounts', async () => {
      m.auth.mockResolvedValue(null);

      await GET(
        request({ profileUrl: PROFILE_URL, username: 'jane_doe' })
      ).catch(() => undefined);

      expect(prismaMock.account.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('when the account is already linked to the user', () => {
    beforeEach(() => {
      prismaMock.account.findFirst.mockResolvedValue({
        id: 'account-1',
        userId: TEST_USER.id,
        provider: 'instagram',
        providerAccountId: 'jane_doe'
      });
    });

    it('looks up the account for the user, provider, and username', async () => {
      await GET(
        request({ profileUrl: PROFILE_URL, username: 'jane_doe' })
      ).catch(() => undefined);

      expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
        where: {
          userId: TEST_USER.id,
          provider: 'instagram',
          providerAccountId: 'jane_doe'
        }
      });
    });

    it('updates the account label, link, and timestamp', async () => {
      await GET(
        request({ profileUrl: PROFILE_URL, username: 'jane_doe' })
      ).catch(() => undefined);

      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: {
            provider: 'instagram',
            providerAccountId: 'jane_doe'
          }
        },
        data: {
          label: '@jane_doe',
          link: PROFILE_URL,
          updatedAt: NOW
        }
      });
    });

    it('labels a numeric username with an at sign', async () => {
      await GET(request({ profileUrl: PROFILE_URL, username: '12345' })).catch(
        () => undefined
      );

      expect(prismaMock.account.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ label: '@12345' })
        })
      );
    });

    it('logs the re-link', async () => {
      await GET(
        request({ profileUrl: PROFILE_URL, username: 'jane_doe' })
      ).catch(() => undefined);

      expect(consoleInfo).toHaveBeenCalledWith(
        'Instagram account re-linked - updating existing account',
        { userId: TEST_USER.id, username: 'jane_doe' }
      );
    });

    it('redirects to redirectTo after updating', async () => {
      await expect(
        GET(
          request({
            profileUrl: PROFILE_URL,
            username: 'jane_doe',
            redirectTo: '/browse'
          })
        )
      ).rejects.toMatchObject({ digest: redirectDigest('/browse') });
    });

    it('does not create a new account', async () => {
      await GET(
        request({ profileUrl: PROFILE_URL, username: 'jane_doe' })
      ).catch(() => undefined);

      expect(prismaMock.account.create).not.toHaveBeenCalled();
    });
  });

  describe('when the account is not linked yet', () => {
    it('creates an oauth account for the user', async () => {
      await GET(
        request({ profileUrl: PROFILE_URL, username: 'jane_doe' })
      ).catch(() => undefined);

      expect(prismaMock.account.create).toHaveBeenCalledWith({
        data: {
          userId: TEST_USER.id,
          provider: 'instagram',
          providerAccountId: 'jane_doe',
          type: 'oauth',
          label: '@jane_doe',
          link: PROFILE_URL,
          scope: ''
        }
      });
    });

    it('redirects to the account page by default', async () => {
      await expect(
        GET(request({ profileUrl: PROFILE_URL, username: 'jane_doe' }))
      ).rejects.toMatchObject({ digest: redirectDigest('/account') });
    });

    it('redirects to the account page when redirectTo is empty', async () => {
      await expect(
        GET(
          request({
            profileUrl: PROFILE_URL,
            username: 'jane_doe',
            redirectTo: ''
          })
        )
      ).rejects.toMatchObject({ digest: redirectDigest('/account') });
    });

    it('logs the new link', async () => {
      await GET(
        request({ profileUrl: PROFILE_URL, username: 'jane_doe' })
      ).catch(() => undefined);

      expect(consoleInfo).toHaveBeenCalledWith(
        'Instagram account linked to user',
        { userId: TEST_USER.id, username: 'jane_doe' }
      );
    });

    it('redirects to an absolute redirectTo as given', async () => {
      await expect(
        GET(
          request({
            profileUrl: PROFILE_URL,
            username: 'jane_doe',
            redirectTo: 'https://evil.example/phish'
          })
        )
      ).rejects.toMatchObject({
        digest: redirectDigest('https://evil.example/phish')
      });
    });

    it('does not update any account', async () => {
      await GET(
        request({ profileUrl: PROFILE_URL, username: 'jane_doe' })
      ).catch(() => undefined);

      expect(prismaMock.account.update).not.toHaveBeenCalled();
    });

    it('propagates a unique constraint failure when another user owns the username', async () => {
      const failure = knownRequestError('P2002');
      prismaMock.account.create.mockRejectedValue(failure);

      await expect(
        GET(request({ profileUrl: PROFILE_URL, username: 'jane_doe' }))
      ).rejects.toBe(failure);
    });
  });
});
