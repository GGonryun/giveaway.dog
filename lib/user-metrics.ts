import { getCookie, setCookie } from 'cookies-next';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

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
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height
  };
}

export function getUserMetricsCookie(): UserMetrics | null {
  const value = getCookie(USER_METRICS_COOKIE);

  if (!value) return null;

  try {
    return JSON.parse(value as string);
  } catch {
    return null;
  }
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
  const metricsCookie = cookieStore.get(USER_METRICS_COOKIE);
  if (!metricsCookie?.value) return null;

  try {
    return JSON.parse(metricsCookie.value);
  } catch {
    return null;
  }
};
