import { afterAll, vi } from 'vitest';

vi.resetModules();

afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
