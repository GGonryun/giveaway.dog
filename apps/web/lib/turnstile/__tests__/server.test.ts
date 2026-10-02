import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkTurnstileVerification, verifyTurnstileToken } from '../server';

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

const SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

describe('checkTurnstileVerification', () => {
  beforeEach(() => {
    m.cookieStore.get.mockReset();
  });

  it('reads the turnstile cookie', async () => {
    await checkTurnstileVerification();

    expect(m.cookieStore.get).toHaveBeenCalledWith('turnstile_verified');
  });

  it('returns true when the cookie has a value', async () => {
    m.cookieStore.get.mockReturnValue({
      name: 'turnstile_verified',
      value: 'token-1'
    });

    await expect(checkTurnstileVerification()).resolves.toBe(true);
  });

  it('returns false when the cookie is missing', async () => {
    m.cookieStore.get.mockReturnValue(undefined);

    await expect(checkTurnstileVerification()).resolves.toBe(false);
  });

  it('returns false when the cookie value is empty', async () => {
    m.cookieStore.get.mockReturnValue({
      name: 'turnstile_verified',
      value: ''
    });

    await expect(checkTurnstileVerification()).resolves.toBe(false);
  });
});

describe('verifyTurnstileToken', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CLOUDFLARE_TURNSTILE_SECRET_KEY', 'secret-1');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('development dummy tokens', () => {
    it('accepts a dummy token in development without calling Cloudflare', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('CLOUDFLARE_TURNSTILE_SECRET_KEY', undefined);

      const result = await verifyTurnstileToken('XXXX.DUMMY.TOKEN.XXXX');

      expect(result).toEqual({ success: true });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('verifies non-dummy tokens with Cloudflare in development', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      fetchMock.mockResolvedValue(jsonResponse({ success: true }));

      await verifyTurnstileToken('real-token');

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('does not accept dummy tokens in the test environment', async () => {
      vi.stubEnv('NODE_ENV', 'test');
      fetchMock.mockResolvedValue(
        jsonResponse({ success: false, 'error-codes': ['invalid-input'] })
      );

      const result = await verifyTurnstileToken('XXXX.DUMMY.TOKEN.XXXX');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(false);
    });

    it('does not accept dummy tokens outside development', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ success: false, 'error-codes': ['invalid-input'] })
      );

      const result = await verifyTurnstileToken('XXXX.DUMMY.TOKEN.XXXX');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(false);
    });
  });

  describe('when the secret key is missing', () => {
    it.each([undefined, ''])(
      'returns a secret-missing failure when the key is %j',
      async (secret) => {
        vi.stubEnv('CLOUDFLARE_TURNSTILE_SECRET_KEY', secret);

        const result = await verifyTurnstileToken('token-1');

        expect(result).toEqual({
          success: false,
          'error-codes': ['secret-missing']
        });
        expect(fetchMock).not.toHaveBeenCalled();
      }
    );

    it('logs the missing configuration', async () => {
      vi.stubEnv('CLOUDFLARE_TURNSTILE_SECRET_KEY', undefined);

      await verifyTurnstileToken('token-1');

      expect(console.error).toHaveBeenCalledWith(
        'CLOUDFLARE_TURNSTILE_SECRET_KEY not configured'
      );
    });
  });

  describe('when Cloudflare is called', () => {
    it('posts the secret and token as JSON to the siteverify endpoint', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: true }));

      await verifyTurnstileToken('token-1');

      expect(fetchMock).toHaveBeenCalledWith(SITEVERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: 'secret-1', response: 'token-1' })
      });
    });

    it('returns the Cloudflare response for a successful verification', async () => {
      const body = {
        success: true,
        challenge_ts: '2026-01-01T00:00:00Z',
        hostname: 'giveaway.dog',
        action: 'enter',
        confidence: 0.4
      };
      fetchMock.mockResolvedValue(jsonResponse(body));

      await expect(verifyTurnstileToken('token-1')).resolves.toEqual(body);
    });

    it('sets maximum confidence when the challenge passed without interaction', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          success: true,
          confidence: 0.2,
          metadata: { interactive: false }
        })
      );

      const result = await verifyTurnstileToken('token-1');

      expect(result.confidence).toBe(1);
    });

    it('keeps the reported confidence for interactive challenges', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          success: true,
          confidence: 0.2,
          metadata: { interactive: true }
        })
      );

      const result = await verifyTurnstileToken('token-1');

      expect(result.confidence).toBe(0.2);
    });

    it('leaves confidence unset when there is no interaction metadata', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: true }));

      const result = await verifyTurnstileToken('token-1');

      expect(result.confidence).toBeUndefined();
    });

    it('does not raise confidence for failed non-interactive challenges', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          success: false,
          'error-codes': ['invalid-input-response'],
          metadata: { interactive: false }
        })
      );

      const result = await verifyTurnstileToken('token-1');

      expect(result.confidence).toBeUndefined();
    });

    it('returns the response body even for an HTTP error status', async () => {
      const body = { success: false, 'error-codes': ['internal-error'] };
      fetchMock.mockResolvedValue(jsonResponse(body, 500));

      await expect(verifyTurnstileToken('token-1')).resolves.toEqual(body);
    });
  });

  describe('when verification fails', () => {
    it('returns the failure without warning for duplicate or expired tokens', async () => {
      const body = { success: false, 'error-codes': ['timeout-or-duplicate'] };
      fetchMock.mockResolvedValue(jsonResponse(body));

      const result = await verifyTurnstileToken('token-1');

      expect(result).toEqual(body);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('does not warn when no error codes are reported', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: false }));

      const result = await verifyTurnstileToken('token-1');

      expect(result).toEqual({ success: false });
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('warns about unexpected error codes', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          success: false,
          'error-codes': ['invalid-input-secret']
        })
      );

      await verifyTurnstileToken('token-1');

      expect(console.warn).toHaveBeenCalledWith(
        'Turnstile verification failed:',
        ['invalid-input-secret']
      );
    });

    it('warns when unexpected codes accompany an expected one', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          success: false,
          'error-codes': ['timeout-or-duplicate', 'bad-request']
        })
      );

      await verifyTurnstileToken('token-1');

      expect(console.warn).toHaveBeenCalledWith(
        'Turnstile verification failed:',
        ['timeout-or-duplicate', 'bad-request']
      );
    });
  });

  describe('when the request cannot be completed', () => {
    it('returns a network-error failure when fetch rejects', async () => {
      fetchMock.mockRejectedValue(new TypeError('fetch failed'));

      await expect(verifyTurnstileToken('token-1')).resolves.toEqual({
        success: false,
        'error-codes': ['network-error']
      });
    });

    it('logs the network error', async () => {
      const networkError = new TypeError('fetch failed');
      fetchMock.mockRejectedValue(networkError);

      await verifyTurnstileToken('token-1');

      expect(console.error).toHaveBeenCalledWith(
        'Turnstile verification error:',
        networkError
      );
    });

    it('returns a network-error failure when the body is not JSON', async () => {
      fetchMock.mockResolvedValue(new Response('<html>oops</html>'));

      await expect(verifyTurnstileToken('token-1')).resolves.toEqual({
        success: false,
        'error-codes': ['network-error']
      });
    });
  });
});
