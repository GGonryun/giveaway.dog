import type { APIRequestContext } from '@playwright/test';
import { E2E_SECRET } from '../env';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

const ATTEMPTS = 5;

const RETRY_DELAY_MS = 2_000;

const COMPILE_TIMEOUT_MS = 120_000;

export type WarmUpRoute = {
  path: string;
  headers?: Record<string, string>;
};

export type WarmUpResult = {
  path: string;
  status: number;
  attempts: number;
};

export const isLocalDeployment = (url: string) =>
  LOCAL_HOSTS.has(new URL(url).hostname);

export const warmUpRoutes = (secret = E2E_SECRET): WarmUpRoute[] => [
  { path: '/api/auth/csrf' },
  { path: '/api/auth/session' },
  ...(secret
    ? [{ path: '/api/e2e/health', headers: { 'x-e2e-secret': secret } }]
    : []),
  { path: '/' },
  { path: '/login' }
];

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const warmUp = async (
  request: APIRequestContext,
  routes = warmUpRoutes()
): Promise<WarmUpResult[]> => {
  const results: WarmUpResult[] = [];

  for (const route of routes) {
    let status = 0;
    let attempts = 0;

    while (attempts < ATTEMPTS) {
      attempts += 1;
      const response = await request.get(route.path, {
        headers: route.headers,
        timeout: COMPILE_TIMEOUT_MS
      });
      status = response.status();
      if (status !== 404) break;
      if (attempts < ATTEMPTS) await wait(RETRY_DELAY_MS);
    }

    results.push({ path: route.path, status, attempts });
  }

  return results;
};
