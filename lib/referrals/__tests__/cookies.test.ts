import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  clearReferralCodeCookie,
  getReferralCodeCookie,
  getReferralCodeFromServerCookies,
  MAX_REFERRAL_COOKIE_AGE_SECONDS,
  REFERRAL_CODE_COOKIE,
  setReferralCodeCookie
} from '../cookies';

const cookiesNext = vi.hoisted(() => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
  deleteCookie: vi.fn()
}));

vi.mock('cookies-next', () => cookiesNext);

type CookieStore = Parameters<typeof getReferralCodeFromServerCookies>[0];

const cookieStore = (value?: string) => {
  const get = vi.fn(() =>
    value === undefined ? undefined : { name: REFERRAL_CODE_COOKIE, value }
  );
  return { store: { get } as unknown as CookieStore, get };
};

describe('referral cookie constants', () => {
  it('stores the referral code under the referral_code cookie', () => {
    expect(REFERRAL_CODE_COOKIE).toBe('referral_code');
  });

  it('keeps the cookie for thirty days', () => {
    expect(MAX_REFERRAL_COOKIE_AGE_SECONDS).toBe(2592000);
  });
});

describe('getReferralCodeCookie', () => {
  beforeEach(() => {
    cookiesNext.getCookie.mockReset();
  });

  it('reads the referral code cookie', () => {
    cookiesNext.getCookie.mockReturnValue('abc123');

    expect(getReferralCodeCookie()).toBe('abc123');
    expect(cookiesNext.getCookie).toHaveBeenCalledWith('referral_code');
  });

  it('returns null when the cookie is missing', () => {
    cookiesNext.getCookie.mockReturnValue(undefined);

    expect(getReferralCodeCookie()).toBeNull();
  });

  it('returns null when the cookie is empty', () => {
    cookiesNext.getCookie.mockReturnValue('');

    expect(getReferralCodeCookie()).toBeNull();
  });

  it('stringifies non string cookie values', () => {
    cookiesNext.getCookie.mockReturnValue(42);

    expect(getReferralCodeCookie()).toBe('42');
  });
});

describe('setReferralCodeCookie', () => {
  beforeEach(() => {
    cookiesNext.setCookie.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sets a lax, non secure cookie outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');

    setReferralCodeCookie('abc123');

    expect(cookiesNext.setCookie).toHaveBeenCalledWith(
      'referral_code',
      'abc123',
      { maxAge: 2592000, path: '/', sameSite: 'lax', secure: false }
    );
  });

  it('sets a cross site, secure cookie in production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    setReferralCodeCookie('abc123');

    expect(cookiesNext.setCookie).toHaveBeenCalledWith(
      'referral_code',
      'abc123',
      { maxAge: 2592000, path: '/', sameSite: 'none', secure: true }
    );
  });
});

describe('clearReferralCodeCookie', () => {
  it('deletes the referral code cookie', () => {
    cookiesNext.deleteCookie.mockReset();

    clearReferralCodeCookie();

    expect(cookiesNext.deleteCookie).toHaveBeenCalledWith('referral_code');
  });
});

describe('getReferralCodeFromServerCookies', () => {
  it('returns the referral cookie value from the request cookies', () => {
    const { store, get } = cookieStore('xyz789');

    expect(getReferralCodeFromServerCookies(store)).toBe('xyz789');
    expect(get).toHaveBeenCalledWith('referral_code');
  });

  it('returns null when the cookie is not present', () => {
    const { store } = cookieStore();

    expect(getReferralCodeFromServerCookies(store)).toBeNull();
  });

  it('returns an empty string when the cookie value is empty', () => {
    const { store } = cookieStore('');

    expect(getReferralCodeFromServerCookies(store)).toBe('');
  });
});
