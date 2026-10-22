import { describe, expect, it } from 'vitest';
import {
  E2E_CREDITS_POOL_COOKIE,
  E2E_CREDITS_SECRET_COOKIE,
  e2eCreditPoolSchema
} from '../credits';

describe('the e2e credit pool cookies', () => {
  it('names the cookies of the secret and the pool', () => {
    expect({ E2E_CREDITS_SECRET_COOKIE, E2E_CREDITS_POOL_COOKIE }).toEqual({
      E2E_CREDITS_SECRET_COOKIE: 'e2e-credits',
      E2E_CREDITS_POOL_COOKIE: 'e2e-credits-pool'
    });
  });
});

describe('e2eCreditPoolSchema', () => {
  it.each(['abcd', 'run123-0-1', 'a'.repeat(40)])('accepts %s', (pool) => {
    expect(e2eCreditPoolSchema.safeParse(pool).success).toBe(true);
  });

  it.each([
    'abc',
    'a'.repeat(41),
    'Run123',
    'run_123',
    'run 123',
    ' run123',
    'run123 ',
    'ip:1.2.3.4'
  ])('refuses %j', (pool) => {
    expect(e2eCreditPoolSchema.safeParse(pool).success).toBe(false);
  });
});
