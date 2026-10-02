import { setCookie, deleteCookie } from 'cookies-next';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

export const LAST_TEAM_SLUG_COOKIE = 'last_team_slug';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function setLastTeamSlugCookie(slug: string): void {
  setCookie(LAST_TEAM_SLUG_COOKIE, slug, {
    maxAge: MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax'
  });
}

export function clearLastTeamSlugCookie(): void {
  deleteCookie(LAST_TEAM_SLUG_COOKIE);
}

export function getLastTeamSlugFromServerCookies(
  cookieStore: ReadonlyRequestCookies
): string | null {
  return cookieStore.get(LAST_TEAM_SLUG_COOKIE)?.value ?? null;
}
