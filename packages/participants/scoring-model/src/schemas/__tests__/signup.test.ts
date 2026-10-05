import { describe, it, expect } from 'vitest';
import { UserSource } from '@giveaway/db-model';
import * as signup from '../signup';
import {
  signupUserQualitySchema,
  importedUserQualitySchema,
  userQualitySchema,
  toUserQuality
} from '../signup';

const CREATED_AT = new Date('2026-03-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-03-02T00:00:00.000Z');

type QualityRow = Parameters<typeof toUserQuality>[0];

const qualityRow = (
  source: UserSource,
  overrides: Partial<QualityRow> = {}
): QualityRow => ({
  id: 'quality-1',
  userId: 'user-1',
  score: 64,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
  user: { source },
  ...overrides
});

const rawQuality = {
  id: 'quality-1',
  userId: 'user-1',
  score: 64,
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-02T00:00:00.000Z'
};

describe('signup scoring constants', () => {
  it('exposes the documented weights and limits', () => {
    expect({
      USER_BASE_SCORE: signup.USER_BASE_SCORE,
      MAX_SCORING_REQUESTS_PER_RUN: signup.MAX_SCORING_REQUESTS_PER_RUN,
      MAX_TRACKING_REQUESTS_PER_RUN: signup.MAX_TRACKING_REQUESTS_PER_RUN,
      COMPLETION_THRESHOLD_DAYS: signup.COMPLETION_THRESHOLD_DAYS,
      IP_ADDRESS_THRESHOLD_DAYS: signup.IP_ADDRESS_THRESHOLD_DAYS,
      MAX_DEVICE_STABILITY_BONUS: signup.MAX_DEVICE_STABILITY_BONUS,
      PER_DEVICE_STABILITY_BONUS: signup.PER_DEVICE_STABILITY_BONUS,
      DEVICE_STABILITY_BONUS_STEP: signup.DEVICE_STABILITY_BONUS_STEP,
      MAX_IP_CONSISTENCY_BONUS: signup.MAX_IP_CONSISTENCY_BONUS,
      PER_ADDITIONAL_IP_PENALTY: signup.PER_ADDITIONAL_IP_PENALTY,
      MAX_GEO_CONSISTENCY_BONUS: signup.MAX_GEO_CONSISTENCY_BONUS,
      GEO_COUNTRY_BONUS: signup.GEO_COUNTRY_BONUS,
      GEO_CONTINENT_BONUS: signup.GEO_CONTINENT_BONUS,
      MAX_PROVIDERS_CONNECTED_BONUS: signup.MAX_PROVIDERS_CONNECTED_BONUS,
      PER_PROVIDER_BONUS: signup.PER_PROVIDER_BONUS,
      MAX_EMAIL_VERIFIED_BONUS: signup.MAX_EMAIL_VERIFIED_BONUS,
      MAX_TASK_ACTIVITY_BONUS: signup.MAX_TASK_ACTIVITY_BONUS,
      PER_TASK_BONUS: signup.PER_TASK_BONUS,
      MAX_TASK_DIVERSITY_BONUS: signup.MAX_TASK_DIVERSITY_BONUS,
      MAX_ACCOUNT_AGE_BONUS: signup.MAX_ACCOUNT_AGE_BONUS,
      MAX_IP_CONSISTENCY_PUNISHMENT: signup.MAX_IP_CONSISTENCY_PUNISHMENT,
      MAX_FINGERPRINT_CONSISTENCY_PUNISHMENT:
        signup.MAX_FINGERPRINT_CONSISTENCY_PUNISHMENT,
      MAX_TURNSTILE_TRUST_BONUS: signup.MAX_TURNSTILE_TRUST_BONUS,
      MIN_TURNSTILE_TRUST_PENALTY: signup.MIN_TURNSTILE_TRUST_PENALTY
    }).toEqual({
      USER_BASE_SCORE: 30,
      MAX_SCORING_REQUESTS_PER_RUN: 15,
      MAX_TRACKING_REQUESTS_PER_RUN: 10,
      COMPLETION_THRESHOLD_DAYS: 30,
      IP_ADDRESS_THRESHOLD_DAYS: 30,
      MAX_DEVICE_STABILITY_BONUS: 20,
      PER_DEVICE_STABILITY_BONUS: 2,
      DEVICE_STABILITY_BONUS_STEP: 10,
      MAX_IP_CONSISTENCY_BONUS: 20,
      PER_ADDITIONAL_IP_PENALTY: 5,
      MAX_GEO_CONSISTENCY_BONUS: 10,
      GEO_COUNTRY_BONUS: 5,
      GEO_CONTINENT_BONUS: 2,
      MAX_PROVIDERS_CONNECTED_BONUS: 10,
      PER_PROVIDER_BONUS: 2,
      MAX_EMAIL_VERIFIED_BONUS: 10,
      MAX_TASK_ACTIVITY_BONUS: 10,
      PER_TASK_BONUS: 3,
      MAX_TASK_DIVERSITY_BONUS: 10,
      MAX_ACCOUNT_AGE_BONUS: 10,
      MAX_IP_CONSISTENCY_PUNISHMENT: -30,
      MAX_FINGERPRINT_CONSISTENCY_PUNISHMENT: -30,
      MAX_TURNSTILE_TRUST_BONUS: 10,
      MIN_TURNSTILE_TRUST_PENALTY: -10
    });
  });
});

describe('signupUserQualitySchema', () => {
  it('accepts a SIGNUP quality and coerces its dates', () => {
    expect(
      signupUserQualitySchema.parse({ ...rawQuality, type: 'SIGNUP' })
    ).toEqual({
      type: 'SIGNUP',
      id: 'quality-1',
      userId: 'user-1',
      score: 64,
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT
    });
  });

  it('rejects an IMPORTED type', () => {
    expect(
      signupUserQualitySchema.safeParse({ ...rawQuality, type: 'IMPORTED' })
        .success
    ).toBe(false);
  });

  it('rejects an unparseable date', () => {
    const result = signupUserQualitySchema.safeParse({
      ...rawQuality,
      type: 'SIGNUP',
      createdAt: 'yesterday'
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['createdAt']);
  });
});

describe('importedUserQualitySchema', () => {
  it('accepts an IMPORTED quality', () => {
    expect(
      importedUserQualitySchema.parse({ ...rawQuality, type: 'IMPORTED' }).type
    ).toBe('IMPORTED');
  });

  it('rejects a non-numeric score', () => {
    expect(
      importedUserQualitySchema.safeParse({
        ...rawQuality,
        type: 'IMPORTED',
        score: '64'
      }).success
    ).toBe(false);
  });
});

describe('userQualitySchema', () => {
  it.each(['SIGNUP', 'IMPORTED'])('accepts the %s variant', (type) => {
    expect(userQualitySchema.parse({ ...rawQuality, type }).type).toBe(type);
  });

  it('rejects an unknown discriminator', () => {
    const result = userQualitySchema.safeParse({
      ...rawQuality,
      type: 'MANUAL'
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].code).toBe('invalid_union_discriminator');
  });
});

describe('toUserQuality', () => {
  describe.each([
    UserSource.SIGNUP,
    UserSource.ANONYMOUS,
    UserSource.MANUAL_IMPORT
  ])('when the user source is %s', (source) => {
    it('returns a SIGNUP quality', () => {
      expect(toUserQuality(qualityRow(source))).toEqual({
        type: 'SIGNUP',
        id: 'quality-1',
        userId: 'user-1',
        score: 64,
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT
      });
    });
  });

  describe.each([
    UserSource.TWITTER_IMPORT,
    UserSource.BLUESKY_IMPORT,
    UserSource.DISCORD_IMPORT,
    UserSource.TWITCH_IMPORT
  ])('when the user source is %s', (source) => {
    it('returns an IMPORTED quality', () => {
      expect(toUserQuality(qualityRow(source))).toEqual({
        type: 'IMPORTED',
        id: 'quality-1',
        userId: 'user-1',
        score: 64,
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT
      });
    });
  });

  it.each([
    [-15, 0],
    [0, 0],
    [100, 100],
    [140, 100]
  ])('clamps a score of %i to %i', (score, expected) => {
    expect(toUserQuality(qualityRow('SIGNUP', { score })).score).toBe(expected);
  });

  it('produces values accepted by userQualitySchema', () => {
    const quality = toUserQuality(qualityRow('TWITTER_IMPORT'));

    expect(userQualitySchema.parse(quality)).toEqual(quality);
  });

  it('throws for an unknown user source', () => {
    expect(() =>
      toUserQuality(qualityRow('SCRAPED' as unknown as UserSource))
    ).toThrow('Unexpected value: SCRAPED');
  });
});
