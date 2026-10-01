import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prismaMock } from '@/test/prisma';
import { authMock, createSession, signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import { getLastTurnstileCheck } from '../check-status';

const m = vi.hoisted(() => {
  const cookieStore = { get: vi.fn(), set: vi.fn() };
  return {
    cookieStore,
    cookies: vi.fn(async () => cookieStore)
  };
});

vi.mock('next/headers', () => ({
  cookies: m.cookies
}));

const NOW = new Date('2026-06-15T12:00:00.000Z');
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const storedVerification = (overrides: Record<string, unknown> = {}) => ({
  token: 'db-token',
  score: 0.8,
  success: true,
  updatedAt: new Date(NOW.getTime() - 60_000),
  ...overrides
});

const setCookie = (value: string | undefined) => {
  m.cookieStore.get.mockReturnValue(
    value === undefined ? undefined : { name: 'turnstile_verified', value }
  );
};

const cloudflareResponds = (body: Record<string, unknown>) => {
  vi.mocked(fetch).mockResolvedValue(
    new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' }
    })
  );
};

describe('getLastTurnstileCheck', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubGlobal('fetch', vi.fn());
    vi.stubEnv('CLOUDFLARE_TURNSTILE_SECRET_KEY', 'secret-1');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    m.cookies.mockClear();
    m.cookieStore.get.mockReset();
    setCookie(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('when the user is signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('looks up the stored verification for the user', async () => {
      prismaMock.userTurnstile.findUnique.mockResolvedValue(null);

      await getLastTurnstileCheck({});

      expect(prismaMock.userTurnstile.findUnique).toHaveBeenCalledWith({
        where: { userId: TEST_USER.id },
        select: { token: true, score: true, success: true, updatedAt: true }
      });
    });

    it('returns a recent successful stored verification', async () => {
      const stored = storedVerification();
      prismaMock.userTurnstile.findUnique.mockResolvedValue(stored);

      const result = await getLastTurnstileCheck({});

      expect(expectOk(result)).toEqual({
        token: 'db-token',
        score: 0.8,
        lastCheckedAt: stored.updatedAt
      });
    });

    it('does not read the cookie when the stored verification is valid', async () => {
      prismaMock.userTurnstile.findUnique.mockResolvedValue(
        storedVerification()
      );

      await getLastTurnstileCheck({});

      expect(m.cookies).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('returns a null score from the stored verification', async () => {
      prismaMock.userTurnstile.findUnique.mockResolvedValue(
        storedVerification({ score: null })
      );

      const result = await getLastTurnstileCheck({});

      expect(expectOk(result)?.score).toBeNull();
    });

    it('accepts a stored verification that is exactly seven days old', async () => {
      const updatedAt = new Date(NOW.getTime() - SEVEN_DAYS_MS);
      prismaMock.userTurnstile.findUnique.mockResolvedValue(
        storedVerification({ updatedAt })
      );

      const result = await getLastTurnstileCheck({});

      expect(expectOk(result)?.lastCheckedAt).toEqual(updatedAt);
    });

    it('ignores a stored verification older than seven days', async () => {
      prismaMock.userTurnstile.findUnique.mockResolvedValue(
        storedVerification({
          updatedAt: new Date(NOW.getTime() - SEVEN_DAYS_MS - 1)
        })
      );

      const result = await getLastTurnstileCheck({});

      expect(expectOk(result)).toBeUndefined();
      expect(m.cookieStore.get).toHaveBeenCalledWith('turnstile_verified');
    });

    it('ignores an unsuccessful stored verification', async () => {
      prismaMock.userTurnstile.findUnique.mockResolvedValue(
        storedVerification({ success: false })
      );

      const result = await getLastTurnstileCheck({});

      expect(expectOk(result)).toBeUndefined();
    });

    it('ignores a stored verification without a token', async () => {
      prismaMock.userTurnstile.findUnique.mockResolvedValue(
        storedVerification({ token: null })
      );

      const result = await getLastTurnstileCheck({});

      expect(expectOk(result)).toBeUndefined();
    });

    it('falls back to a verified cookie when the stored verification is stale', async () => {
      prismaMock.userTurnstile.findUnique.mockResolvedValue(
        storedVerification({
          updatedAt: new Date(NOW.getTime() - SEVEN_DAYS_MS - 1)
        })
      );
      setCookie('cookie-token');
      cloudflareResponds({ success: true, confidence: 0.5 });

      const result = await getLastTurnstileCheck({});

      expect(expectOk(result)).toEqual({
        token: 'cookie-token',
        score: 0.5,
        lastCheckedAt: NOW
      });
    });

    it('falls back to the cookie when there is no stored verification', async () => {
      prismaMock.userTurnstile.findUnique.mockResolvedValue(null);
      setCookie('cookie-token');
      cloudflareResponds({ success: true, confidence: 0.5 });

      const result = await getLastTurnstileCheck({});

      expect(expectOk(result)?.token).toBe('cookie-token');
    });

    it('returns INTERNAL_SERVER_ERROR when the lookup fails', async () => {
      prismaMock.userTurnstile.findUnique.mockRejectedValue(
        new Error('db down')
      );

      const result = await getLastTurnstileCheck({});

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'db down'
      );
    });
  });

  describe('when the user is signed out', () => {
    it('does not query stored verifications', async () => {
      await getLastTurnstileCheck({});

      expect(prismaMock.userTurnstile.findUnique).not.toHaveBeenCalled();
    });

    it('treats an expired session as signed out', async () => {
      authMock.mockResolvedValue(createSession({}, '2026-06-15T11:59:59.000Z'));

      await getLastTurnstileCheck({});

      expect(prismaMock.userTurnstile.findUnique).not.toHaveBeenCalled();
    });

    it('returns no status when there is no cookie', async () => {
      const result = await getLastTurnstileCheck({});

      expect(expectOk(result)).toBeUndefined();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('returns no status when the cookie is empty', async () => {
      setCookie('');

      const result = await getLastTurnstileCheck({});

      expect(expectOk(result)).toBeUndefined();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('verifies the cookie token with Cloudflare', async () => {
      setCookie('cookie-token');
      cloudflareResponds({ success: true });

      await getLastTurnstileCheck({});

      expect(fetch).toHaveBeenCalledWith(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        expect.objectContaining({
          body: JSON.stringify({ secret: 'secret-1', response: 'cookie-token' })
        })
      );
    });

    it('returns the cookie token with the confidence as score', async () => {
      setCookie('cookie-token');
      cloudflareResponds({ success: true, confidence: 0.3 });

      const result = await getLastTurnstileCheck({});

      expect(expectOk(result)).toEqual({
        token: 'cookie-token',
        score: 0.3,
        lastCheckedAt: NOW
      });
    });

    it('returns a null score when Cloudflare reports no confidence', async () => {
      setCookie('cookie-token');
      cloudflareResponds({ success: true });

      const result = await getLastTurnstileCheck({});

      expect(expectOk(result)?.score).toBeNull();
    });

    it('returns full confidence for a non-interactive pass', async () => {
      setCookie('cookie-token');
      cloudflareResponds({ success: true, metadata: { interactive: false } });

      const result = await getLastTurnstileCheck({});

      expect(expectOk(result)?.score).toBe(1);
    });

    it('returns no status when the cookie token fails verification', async () => {
      setCookie('cookie-token');
      cloudflareResponds({
        success: false,
        'error-codes': ['timeout-or-duplicate']
      });

      const result = await getLastTurnstileCheck({});

      expect(expectOk(result)).toBeUndefined();
    });
  });

  it('rejects input that is not an object', async () => {
    const result = await getLastTurnstileCheck(
      null as unknown as Parameters<typeof getLastTurnstileCheck>[0]
    );

    expectFailure(result, 'UNPROCESSABLE_CONTENT');
    expect(m.cookies).not.toHaveBeenCalled();
  });
});
