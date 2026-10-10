import { vi } from 'vitest';

export const E2E_TEST_SECRET = 'e2e-secret-with-at-least-32-chars';

export type E2eFakeEnvironment =
  | 'preview'
  | 'development'
  | 'production'
  | 'preview-without-secret';

export const stubE2eFakeEnvironment = (
  environment: E2eFakeEnvironment,
  fakes = 'all'
) => {
  vi.stubEnv('E2E_FAKE_EXTERNALS', fakes);
  vi.stubEnv('E2E_LOGIN_SECRET', E2E_TEST_SECRET);
  vi.stubEnv('VERCEL_TARGET_ENV', undefined);

  if (environment === 'development') {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('VERCEL_ENV', undefined);
    return;
  }

  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv(
    'VERCEL_ENV',
    environment === 'production' ? 'production' : 'preview'
  );
  if (environment === 'preview-without-secret') {
    vi.stubEnv('E2E_LOGIN_SECRET', undefined);
  }
};

export const E2E_CLOSED_GATES: E2eFakeEnvironment[] = [
  'production',
  'preview-without-secret'
];

export const createFakeRedisLists = () => {
  const lists = new Map<string, unknown[]>();
  const ttls = new Map<string, number>();
  const redis = {
    rpush: vi.fn(async (key: string, ...values: unknown[]) => {
      const list = lists.get(key) ?? [];
      list.push(...values.map((value) => structuredClone(value)));
      lists.set(key, list);
      return list.length;
    }),
    ltrim: vi.fn(async (key: string, start: number, stop: number) => {
      const list = lists.get(key) ?? [];
      const from = start < 0 ? Math.max(list.length + start, 0) : start;
      const to = stop < 0 ? list.length + stop : stop;
      lists.set(key, list.slice(from, to + 1));
      return 'OK';
    }),
    expire: vi.fn(async (key: string, seconds: number) => {
      ttls.set(key, seconds);
      return 1;
    }),
    lrange: vi.fn(
      async <T>(key: string, start: number, stop: number): Promise<T[]> => {
        const list = (lists.get(key) ?? []) as T[];
        return list.slice(start, stop < 0 ? list.length + stop + 1 : stop + 1);
      }
    )
  };
  return { redis, lists, ttls };
};
