import { vi } from 'vitest';

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
};

export const resetNextCacheMock = () => {
  for (const fn of Object.values(nextCacheMock)) {
    fn.mockReset();
  }
  nextCacheMock.unstable_cache.mockImplementation(
    (fn: (...args: unknown[]) => unknown) => fn
  );
};
