import { beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from './prisma';
import { resetAuthMock } from './session';
import { resetNextCacheMock } from './next-cache';

vi.mock('next/cache', async () => {
  const { nextCacheMock } = await import('./next-cache');
  return nextCacheMock;
});

beforeEach(() => {
  resetPrismaMock(prismaMock);
  resetAuthMock();
  resetNextCacheMock();
});
