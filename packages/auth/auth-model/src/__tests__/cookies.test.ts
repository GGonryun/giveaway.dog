import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IdentityProvider } from '@giveaway/db-model';
import {
  LAST_LOGIN_PROVIDER_COOKIE,
  getLastLoginProviderCookie,
  setLastLoginProviderCookie
} from '../cookies';

const cookiesNext = vi.hoisted(() => ({
  getCookie: vi.fn(),
  setCookie: vi.fn()
}));

vi.mock('cookies-next', () => cookiesNext);

beforeEach(() => {
  cookiesNext.getCookie.mockReset();
  cookiesNext.setCookie.mockReset();
});

describe('LAST_LOGIN_PROVIDER_COOKIE', () => {
  it('is named last_login_provider', () => {
    expect(LAST_LOGIN_PROVIDER_COOKIE).toBe('last_login_provider');
  });
});

describe('setLastLoginProviderCookie', () => {
  it('stores the provider for one year on the root path with lax same-site', () => {
    setLastLoginProviderCookie(IdentityProvider.GOOGLE);

    expect(cookiesNext.setCookie).toHaveBeenCalledWith(
      'last_login_provider',
      'GOOGLE',
      { maxAge: 31536000, path: '/', sameSite: 'lax' }
    );
  });

  it('sets the cookie exactly once', () => {
    setLastLoginProviderCookie(IdentityProvider.DISCORD);

    expect(cookiesNext.setCookie).toHaveBeenCalledTimes(1);
  });
});

describe('getLastLoginProviderCookie', () => {
  it('reads the last_login_provider cookie', () => {
    cookiesNext.getCookie.mockReturnValue('TWITTER');

    getLastLoginProviderCookie();

    expect(cookiesNext.getCookie).toHaveBeenCalledWith('last_login_provider');
  });

  it('returns the stored provider', () => {
    cookiesNext.getCookie.mockReturnValue('TWITTER');

    expect(getLastLoginProviderCookie()).toBe('TWITTER');
  });

  it('returns the stored value without validating it is a provider', () => {
    cookiesNext.getCookie.mockReturnValue('not-a-provider');

    expect(getLastLoginProviderCookie()).toBe('not-a-provider');
  });

  it('returns null when the cookie is missing', () => {
    cookiesNext.getCookie.mockReturnValue(undefined);

    expect(getLastLoginProviderCookie()).toBeNull();
  });

  it('returns null when the cookie is an empty string', () => {
    cookiesNext.getCookie.mockReturnValue('');

    expect(getLastLoginProviderCookie()).toBeNull();
  });
});
