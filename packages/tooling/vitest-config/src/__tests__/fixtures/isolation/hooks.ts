import { beforeEach } from 'vitest';

export const hook = { runs: 0 };

beforeEach(() => {
  hook.runs += 1;
});
