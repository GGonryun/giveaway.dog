import { getCookie, setCookie } from 'cookies-next';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { timezone } from '@giveaway/util-time/time';

export interface UserMetrics {
  userAgent: string;
  acceptLanguage: string;
  timezone: string;
  screenWidth: number;
  screenHeight: number;
}

export const USER_METRICS_COOKIE = 'user_metrics';
export const MAX_USER_METRICS_COOKIE_AGE_SECONDS = 60 * 60; // 1 hour

export function collectUserMetrics(): UserMetrics | null {
  if (typeof window === 'undefined') return null;

  return {
    userAgent: navigator.userAgent,
    acceptLanguage: navigator.language,
    timezone: timezone.current(),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height
  };
}

function parseUserMetrics(value: unknown): UserMetrics | null {
  try {
    return JSON.parse(value as string);
  } catch {
    return null;
  }
}

export function getUserMetricsCookie(): UserMetrics | null {
  return parseUserMetrics(getCookie(USER_METRICS_COOKIE));
}

export function setUserMetricsCookie(metrics: UserMetrics): void {
  setCookie(USER_METRICS_COOKIE, JSON.stringify(metrics), {
    maxAge: MAX_USER_METRICS_COOKIE_AGE_SECONDS,
    path: '/',
    sameSite: 'lax'
  });
}

export const getUserMetricsFromServerCookies = (
  cookieStore: ReadonlyRequestCookies
): UserMetrics | null => {
  return parseUserMetrics(cookieStore.get(USER_METRICS_COOKIE)?.value);
};
