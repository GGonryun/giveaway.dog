import { describe, it, expect } from 'vitest';
import {
  TURNSTILE_COOKIE_DAYS,
  TURNSTILE_COOKIE_NAME,
  TURNSTILE_DB_DAYS
} from '../consts';

describe('turnstile constants', () => {
  it('names the verification cookie turnstile_verified', () => {
    expect(TURNSTILE_COOKIE_NAME).toBe('turnstile_verified');
  });

  it('keeps the cookie for three days', () => {
    expect(TURNSTILE_COOKIE_DAYS).toBe(3);
  });

  it('trusts stored verifications for seven days', () => {
    expect(TURNSTILE_DB_DAYS).toBe(7);
  });

  it('trusts stored verifications longer than the cookie lifetime', () => {
    expect(TURNSTILE_DB_DAYS).toBeGreaterThan(TURNSTILE_COOKIE_DAYS);
  });
});
