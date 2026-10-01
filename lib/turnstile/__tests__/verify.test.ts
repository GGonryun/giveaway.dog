import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prismaMock } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import verifyTurnstile from '../verify';

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

const NOW = new Date('2026-07-01T08:00:00.000Z');

const cloudflareResponds = (body: Record<string, unknown>) => {
  vi.mocked(fetch).mockResolvedValue(
    new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' }
    })
  );
};

describe('verifyTurnstile', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubGlobal('fetch', vi.fn());
    vi.stubEnv('CLOUDFLARE_TURNSTILE_SECRET_KEY', 'secret-1');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    m.cookieStore.set.mockReset();
    cloudflareResponds({ success: true, confidence: 0.7 });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('input validation', () => {
    it('rejects a missing token without verifying', async () => {
      const result = await verifyTurnstile(
        {} as unknown as Parameters<typeof verifyTurnstile>[0]
      );

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('rejects a non-string token', async () => {
      const result = await verifyTurnstile({
        token: 123
      } as unknown as Parameters<typeof verifyTurnstile>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });

    it('accepts an empty token and still sends it to Cloudflare', async () => {
      cloudflareResponds({
        success: false,
        'error-codes': ['missing-input-response']
      });

      const result = await verifyTurnstile({ token: '' });

      expect(expectOk(result)).toEqual({ success: false, verified: true });
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ secret: 'secret-1', response: '' })
        })
      );
    });
  });

  describe('when the user is signed out', () => {
    it('verifies the token with Cloudflare', async () => {
      await verifyTurnstile({ token: 'token-1' });

      expect(fetch).toHaveBeenCalledWith(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        expect.objectContaining({
          body: JSON.stringify({ secret: 'secret-1', response: 'token-1' })
        })
      );
    });

    it('stores a verified token in the cookie', async () => {
      await verifyTurnstile({ token: 'token-1' });

      expect(m.cookieStore.set).toHaveBeenCalledWith(
        'turnstile_verified',
        'token-1',
        expect.objectContaining({ maxAge: 259200, path: '/' })
      );
    });

    it('returns success for a verified token', async () => {
      const result = await verifyTurnstile({ token: 'token-1' });

      expect(expectOk(result)).toEqual({ success: true, verified: true });
    });

    it('does not write to the database', async () => {
      await verifyTurnstile({ token: 'token-1' });

      expect(prismaMock.userTurnstile.upsert).not.toHaveBeenCalled();
      expect(prismaMock.userScoringRequest.upsert).not.toHaveBeenCalled();
    });

    it('does not set the cookie when verification fails', async () => {
      cloudflareResponds({
        success: false,
        'error-codes': ['timeout-or-duplicate']
      });

      await verifyTurnstile({ token: 'token-1' });

      expect(m.cookieStore.set).not.toHaveBeenCalled();
    });

    it('reports verified true even when verification fails', async () => {
      cloudflareResponds({
        success: false,
        'error-codes': ['timeout-or-duplicate']
      });

      const result = await verifyTurnstile({ token: 'token-1' });

      expect(expectOk(result)).toEqual({ success: false, verified: true });
    });

    it('still sends the failed sentinel token to Cloudflare', async () => {
      await verifyTurnstile({ token: 'failed' });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ secret: 'secret-1', response: 'failed' })
        })
      );
    });

    it('does not set the cookie for the failed sentinel token even if Cloudflare accepts it', async () => {
      await verifyTurnstile({ token: 'failed' });

      expect(m.cookieStore.set).not.toHaveBeenCalled();
    });

    it('reports a network failure as an unsuccessful verification', async () => {
      vi.mocked(fetch).mockRejectedValue(new TypeError('fetch failed'));

      const result = await verifyTurnstile({ token: 'token-1' });

      expect(expectOk(result)).toEqual({ success: false, verified: true });
      expect(m.cookieStore.set).not.toHaveBeenCalled();
    });
  });

  describe('when the user is signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('records the verification result for the user', async () => {
      await verifyTurnstile({ token: 'token-1' });

      expect(prismaMock.userTurnstile.upsert).toHaveBeenCalledWith({
        where: { userId: TEST_USER.id },
        update: {
          token: 'token-1',
          success: true,
          score: 0.7,
          updatedAt: NOW
        },
        create: {
          userId: TEST_USER.id,
          token: 'token-1',
          success: true,
          score: 0.7
        }
      });
    });

    it('requests a scoring refresh for the user', async () => {
      await verifyTurnstile({ token: 'token-1' });

      expect(prismaMock.userScoringRequest.upsert).toHaveBeenCalledWith({
        where: { userId: TEST_USER.id },
        update: { updatedAt: NOW },
        create: { userId: TEST_USER.id }
      });
    });

    it('also stores the verified token in the cookie', async () => {
      await verifyTurnstile({ token: 'token-1' });

      expect(m.cookieStore.set).toHaveBeenCalledWith(
        'turnstile_verified',
        'token-1',
        expect.any(Object)
      );
    });

    it('records a failed verification with an undefined score', async () => {
      cloudflareResponds({
        success: false,
        'error-codes': ['invalid-input-response']
      });

      const result = await verifyTurnstile({ token: 'token-1' });

      expect(expectOk(result)).toEqual({ success: false, verified: true });
      expect(prismaMock.userTurnstile.upsert).toHaveBeenCalledWith({
        where: { userId: TEST_USER.id },
        update: {
          token: 'token-1',
          success: false,
          score: undefined,
          updatedAt: NOW
        },
        create: {
          userId: TEST_USER.id,
          token: 'token-1',
          success: false,
          score: undefined
        }
      });
      expect(prismaMock.userScoringRequest.upsert).toHaveBeenCalledTimes(1);
    });

    it('stores a null token for the failed sentinel token', async () => {
      cloudflareResponds({ success: false });

      await verifyTurnstile({ token: 'failed' });

      expect(prismaMock.userTurnstile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ token: null, success: false }),
          create: expect.objectContaining({ token: null, success: false })
        })
      );
    });

    it('records full confidence for a non-interactive pass', async () => {
      cloudflareResponds({ success: true, metadata: { interactive: false } });

      await verifyTurnstile({ token: 'token-1' });

      expect(prismaMock.userTurnstile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ score: 1 }),
          create: expect.objectContaining({ score: 1 })
        })
      );
    });

    it('returns INTERNAL_SERVER_ERROR after setting the cookie when recording fails', async () => {
      prismaMock.userTurnstile.upsert.mockRejectedValue(new Error('db down'));

      const result = await verifyTurnstile({ token: 'token-1' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'db down'
      );
      expect(m.cookieStore.set).toHaveBeenCalledTimes(1);
      expect(prismaMock.userScoringRequest.upsert).not.toHaveBeenCalled();
    });
  });
});
