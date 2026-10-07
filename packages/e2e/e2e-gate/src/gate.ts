import 'server-only';

import { createHash, timingSafeEqual } from 'crypto';

export const E2E_SECRET_MIN_LENGTH = 32;

export type E2eEnvironment = 'preview' | 'development';

const env = (name: string) => process.env[name] || undefined;

const isPreviewDeployment = () =>
  env('VERCEL_ENV') === 'preview' &&
  [undefined, 'preview'].includes(env('VERCEL_TARGET_ENV'));

const isDevelopmentServer = () =>
  env('NODE_ENV') === 'development' &&
  [undefined, 'development'].includes(env('VERCEL_ENV')) &&
  [undefined, 'development'].includes(env('VERCEL_TARGET_ENV'));

export const getE2eEnvironment = (): E2eEnvironment | undefined => {
  if (isPreviewDeployment()) return 'preview';
  if (isDevelopmentServer()) return 'development';
  return undefined;
};

export const isE2eEnvironment = () => getE2eEnvironment() !== undefined;

export const getE2eSecret = () => {
  if (!isE2eEnvironment()) return undefined;
  const secret = env('E2E_LOGIN_SECRET');
  if (!secret || secret.length < E2E_SECRET_MIN_LENGTH) return undefined;
  return secret;
};

const digest = (value: string) => createHash('sha256').update(value).digest();

export const verifyE2eSecret = (given: unknown) => {
  const secret = getE2eSecret();
  if (!secret || typeof given !== 'string') return false;
  return timingSafeEqual(digest(given), digest(secret));
};

export const areE2eWritesAllowed = () =>
  isE2eEnvironment() && env('E2E_ALLOW_WRITES') === '1';

export const arePublicE2eGiveawaysAllowed = () =>
  areE2eWritesAllowed() && env('E2E_ALLOW_PUBLIC') === '1';
