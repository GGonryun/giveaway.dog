import { beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from './prisma';
import { resetAuthMock } from './session';
import { resetNextCacheMock } from './next-cache';

vi.mock('@giveaway/db-client/prisma', async () => {
  const { prismaMock } = await import('./prisma');
  return { default: prismaMock };
});

vi.mock('@giveaway/auth-core/config-no-providers', async () => {
  const { authMock } = await import('./session');
  return { noProviderAuth: { auth: authMock } };
});

vi.mock('next/cache', async () => {
  const { nextCacheMock } = await import('./next-cache');
  return nextCacheMock;
});

beforeEach(() => {
  resetPrismaMock(prismaMock);
  resetAuthMock();
  resetNextCacheMock();
});
