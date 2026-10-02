import { describe, it, expect } from 'vitest';
import {
  createReferralSchema,
  DEFAULT_USER_REFERRAL,
  referredUserSchema,
  userReferralSchema
} from '../schemas';

const CREATED_AT = new Date('2026-03-01T00:00:00.000Z');

describe('referredUserSchema', () => {
  it('accepts a referred user', () => {
    const value = { user: { id: 'u-1', name: 'Jane' }, createdAt: CREATED_AT };

    expect(referredUserSchema.parse(value)).toEqual(value);
  });

  it('coerces a string creation date into a Date', () => {
    const parsed = referredUserSchema.parse({
      user: { id: 'u-1', name: 'Jane' },
      createdAt: '2026-03-01T00:00:00.000Z'
    });

    expect(parsed.createdAt).toEqual(CREATED_AT);
  });

  it('rejects a user without a name', () => {
    const result = referredUserSchema.safeParse({
      user: { id: 'u-1', name: null },
      createdAt: CREATED_AT
    });

    expect(result.error?.issues[0].path).toEqual(['user', 'name']);
  });

  it('rejects an invalid creation date', () => {
    const result = referredUserSchema.safeParse({
      user: { id: 'u-1', name: 'Jane' },
      createdAt: 'not a date'
    });

    expect(result.error?.issues[0].path).toEqual(['createdAt']);
  });
});

describe('userReferralSchema', () => {
  it('accepts a referral with referred users', () => {
    const value = {
      id: 'abc123',
      code: 'abc123',
      link: 'https://giveaway.dog/browse/sweep-1?ref=abc123',
      referrals: [{ user: { id: 'u-1', name: 'Jane' }, createdAt: CREATED_AT }]
    };

    expect(userReferralSchema.parse(value)).toEqual(value);
  });

  it.each(['id', 'code', 'link', 'referrals'])(
    'rejects a referral without %s',
    (key) => {
      const value: Record<string, unknown> = {
        id: 'abc123',
        code: 'abc123',
        link: 'https://giveaway.dog/browse/sweep-1?ref=abc123',
        referrals: []
      };
      delete value[key];

      const result = userReferralSchema.safeParse(value);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual([key]);
    }
  );

  it('rejects a referral whose referred user is invalid', () => {
    const result = userReferralSchema.safeParse({
      id: 'abc123',
      code: 'abc123',
      link: 'https://giveaway.dog/browse/sweep-1?ref=abc123',
      referrals: [{ user: { name: 'Jane' }, createdAt: CREATED_AT }]
    });

    expect(result.error?.issues[0].path).toEqual([
      'referrals',
      0,
      'user',
      'id'
    ]);
  });
});

describe('DEFAULT_USER_REFERRAL', () => {
  it('is an empty referral', () => {
    expect(DEFAULT_USER_REFERRAL).toEqual({
      id: '',
      code: '',
      link: '',
      referrals: []
    });
  });

  it('satisfies the user referral schema', () => {
    expect(userReferralSchema.safeParse(DEFAULT_USER_REFERRAL).success).toBe(
      true
    );
  });
});

describe('createReferralSchema', () => {
  it('accepts a task id and sweepstakes id', () => {
    expect(
      createReferralSchema.parse({ taskId: 't-1', sweepstakesId: 's-1' })
    ).toEqual({ taskId: 't-1', sweepstakesId: 's-1' });
  });

  it('rejects a missing task id', () => {
    const result = createReferralSchema.safeParse({ sweepstakesId: 's-1' });

    expect(result.error?.issues[0].path).toEqual(['taskId']);
  });

  it('rejects a missing sweepstakes id', () => {
    const result = createReferralSchema.safeParse({ taskId: 't-1' });

    expect(result.error?.issues[0].path).toEqual(['sweepstakesId']);
  });
});
