import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

export const REFERRAL_CODE_COOKIE = 'referral_code';
export const MAX_REFERRAL_COOKIE_AGE_SECONDS = 60 * 60 * 24 * 30;

export function getReferralCodeCookie(): string | null {
  const value = getCookie(REFERRAL_CODE_COOKIE);
  return value ? String(value) : null;
}

export function setReferralCodeCookie(code: string): void {
  const isProd = process.env.NODE_ENV === 'production';

  setCookie(REFERRAL_CODE_COOKIE, code, {
    maxAge: MAX_REFERRAL_COOKIE_AGE_SECONDS,
    path: '/',
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd
  });
}

export function clearReferralCodeCookie(): void {
  deleteCookie(REFERRAL_CODE_COOKIE);
}

export const getReferralCodeFromServerCookies = (
  cookieStore: ReadonlyRequestCookies
): string | null => {
  const referralCookie = cookieStore.get(REFERRAL_CODE_COOKIE);
  return referralCookie?.value ?? null;
};
