import type * as NextCache from 'next/cache';
import { vi, type Mock } from 'vitest';

export const nextCacheMock = {
  unstable_cache: vi.fn(),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
  refresh: vi.fn(),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
  unstable_noStore: vi.fn(),
  unstable_cacheTag: vi.fn(),
  unstable_cacheLife: vi.fn()
} satisfies Partial<Record<keyof typeof NextCache, Mock>>;

export const resetNextCacheMock = () => {
  for (const fn of Object.values(nextCacheMock)) {
    fn.mockReset();
  }
  nextCacheMock.unstable_cache.mockImplementation(
    (fn: (...args: unknown[]) => unknown) => fn
  );
};
