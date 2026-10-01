import { describe, it, expect } from 'vitest';
import { turnstileStatusSchema } from '../schemas';

describe('turnstileStatusSchema', () => {
  const valid = {
    token: 'token-1',
    score: 0.9,
    lastCheckedAt: new Date('2026-01-01T00:00:00.000Z')
  };

  it('accepts a complete status', () => {
    expect(turnstileStatusSchema.parse(valid)).toEqual(valid);
  });

  it('accepts a null score', () => {
    expect(turnstileStatusSchema.parse({ ...valid, score: null }).score).toBe(
      null
    );
  });

  it('coerces an ISO string into a date', () => {
    const parsed = turnstileStatusSchema.parse({
      ...valid,
      lastCheckedAt: '2026-02-03T04:05:06.000Z'
    });

    expect(parsed.lastCheckedAt).toEqual(new Date('2026-02-03T04:05:06.000Z'));
  });

  it('coerces an epoch timestamp into a date', () => {
    const parsed = turnstileStatusSchema.parse({
      ...valid,
      lastCheckedAt: 0
    });

    expect(parsed.lastCheckedAt).toEqual(new Date(0));
  });

  it('strips unknown keys', () => {
    expect(turnstileStatusSchema.parse({ ...valid, extra: true })).toEqual(
      valid
    );
  });

  it('rejects an unparseable date', () => {
    expect(
      turnstileStatusSchema.safeParse({ ...valid, lastCheckedAt: 'yesterday' })
        .success
    ).toBe(false);
  });

  it('rejects a missing score', () => {
    expect(
      turnstileStatusSchema.safeParse({
        token: 'token-1',
        lastCheckedAt: new Date()
      }).success
    ).toBe(false);
  });

  it('rejects a string score', () => {
    expect(
      turnstileStatusSchema.safeParse({ ...valid, score: '0.9' }).success
    ).toBe(false);
  });

  it('rejects a missing token', () => {
    expect(
      turnstileStatusSchema.safeParse({ score: 1, lastCheckedAt: new Date() })
        .success
    ).toBe(false);
  });

  it('rejects a null token', () => {
    expect(
      turnstileStatusSchema.safeParse({ ...valid, token: null }).success
    ).toBe(false);
  });
});
