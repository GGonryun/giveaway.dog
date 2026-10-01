import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

const cookiesNext = vi.hoisted(() => ({
  setCookie: vi.fn(),
  deleteCookie: vi.fn()
}));

vi.mock('cookies-next', () => cookiesNext);

import {
  LAST_TEAM_SLUG_COOKIE,
  clearLastTeamSlugCookie,
  getLastTeamSlugFromServerCookies,
  setLastTeamSlugCookie
} from '../cookies';

const cookieStore = (value?: string) => {
  const get = vi.fn((name: string) =>
    value === undefined ? undefined : { name, value }
  );
  return { store: { get } as unknown as ReadonlyRequestCookies, get };
};

describe('team cookies', () => {
  beforeEach(() => {
    cookiesNext.setCookie.mockReset();
    cookiesNext.deleteCookie.mockReset();
  });

  it('names the cookie last_team_slug', () => {
    expect(LAST_TEAM_SLUG_COOKIE).toBe('last_team_slug');
  });

  describe('setLastTeamSlugCookie', () => {
    it('stores the slug for one year on the whole site with lax same site', () => {
      setLastTeamSlugCookie('acme');

      expect(cookiesNext.setCookie).toHaveBeenCalledTimes(1);
      expect(cookiesNext.setCookie).toHaveBeenCalledWith(
        'last_team_slug',
        'acme',
        { maxAge: 31536000, path: '/', sameSite: 'lax' }
      );
    });
  });

  describe('clearLastTeamSlugCookie', () => {
    it('deletes the last team slug cookie', () => {
      clearLastTeamSlugCookie();

      expect(cookiesNext.deleteCookie).toHaveBeenCalledWith('last_team_slug');
      expect(cookiesNext.setCookie).not.toHaveBeenCalled();
    });
  });

  describe('getLastTeamSlugFromServerCookies', () => {
    it('returns the cookie value when present', () => {
      const { store, get } = cookieStore('acme');

      expect(getLastTeamSlugFromServerCookies(store)).toBe('acme');
      expect(get).toHaveBeenCalledWith('last_team_slug');
    });

    it('returns null when the cookie is missing', () => {
      const { store } = cookieStore();

      expect(getLastTeamSlugFromServerCookies(store)).toBeNull();
    });

    it('returns an empty string when the cookie value is empty', () => {
      const { store } = cookieStore('');

      expect(getLastTeamSlugFromServerCookies(store)).toBe('');
    });
  });
});
