import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setTurnstileToken } from '../cookies';

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

describe('setTurnstileToken', () => {
  beforeEach(() => {
    m.cookieStore.set.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('stores the token in a lax, insecure cookie outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    await setTurnstileToken('token-1');

    expect(m.cookieStore.set).toHaveBeenCalledWith(
      'turnstile_verified',
      'token-1',
      {
        maxAge: 259200,
        path: '/',
        secure: false,
        sameSite: 'lax',
        httpOnly: false
      }
    );
  });

  it('stores the token in a cross-site secure cookie in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    await setTurnstileToken('token-1');

    expect(m.cookieStore.set).toHaveBeenCalledWith(
      'turnstile_verified',
      'token-1',
      {
        maxAge: 259200,
        path: '/',
        secure: true,
        sameSite: 'none',
        httpOnly: false
      }
    );
  });

  it('treats the test environment as non-production', async () => {
    vi.stubEnv('NODE_ENV', 'test');

    await setTurnstileToken('token-1');

    expect(m.cookieStore.set).toHaveBeenCalledWith(
      'turnstile_verified',
      'token-1',
      expect.objectContaining({ secure: false, sameSite: 'lax' })
    );
  });

  it('writes exactly one cookie', async () => {
    await setTurnstileToken('token-1');

    expect(m.cookieStore.set).toHaveBeenCalledTimes(1);
  });
});
