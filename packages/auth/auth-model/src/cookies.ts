import { getCookie, setCookie } from 'cookies-next';
import { IdentityProvider } from '@giveaway/db-model';

export const LAST_LOGIN_PROVIDER_COOKIE = 'last_login_provider';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function setLastLoginProviderCookie(provider: IdentityProvider): void {
  setCookie(LAST_LOGIN_PROVIDER_COOKIE, provider, {
    maxAge: MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax'
  });
}

export function getLastLoginProviderCookie(): IdentityProvider | null {
  const value = getCookie(LAST_LOGIN_PROVIDER_COOKIE);
  return value ? (value as IdentityProvider) : null;
}
