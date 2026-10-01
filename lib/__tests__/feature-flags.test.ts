import { describe, it, expect } from 'vitest';
import { UserAccountType } from '@prisma/client';
import { featureFlags } from '../feature-flags';
import {
  BASIC_DASHBOARD_FEATURE_FLAG_KEY,
  HOST_DASHBOARD_FEATURE_FLAG_KEY
} from '@/schemas/feature-flags';

describe('featureFlags.parseUser', () => {
  describe('when there is no user', () => {
    it.each([
      ['null', null],
      ['undefined', undefined]
    ])('returns false for the basic flag with %s', (_label, input) => {
      expect(
        featureFlags.parseUser(input, BASIC_DASHBOARD_FEATURE_FLAG_KEY)
      ).toBe(false);
    });

    it('returns false for the host flag', () => {
      expect(
        featureFlags.parseUser(null, HOST_DASHBOARD_FEATURE_FLAG_KEY)
      ).toBe(false);
    });
  });

  describe('for the host dashboard flag', () => {
    it('returns true for a HOST account', () => {
      expect(
        featureFlags.parseUser(
          { accountType: UserAccountType.HOST },
          HOST_DASHBOARD_FEATURE_FLAG_KEY
        )
      ).toBe(true);
    });

    it('returns false for a PARTICIPANT account', () => {
      expect(
        featureFlags.parseUser(
          { accountType: UserAccountType.PARTICIPANT },
          HOST_DASHBOARD_FEATURE_FLAG_KEY
        )
      ).toBe(false);
    });

    it('returns false when the account type is missing', () => {
      expect(featureFlags.parseUser({}, HOST_DASHBOARD_FEATURE_FLAG_KEY)).toBe(
        false
      );
    });
  });

  describe('for the basic dashboard flag', () => {
    it('returns true for a PARTICIPANT account', () => {
      expect(
        featureFlags.parseUser(
          { accountType: UserAccountType.PARTICIPANT },
          BASIC_DASHBOARD_FEATURE_FLAG_KEY
        )
      ).toBe(true);
    });

    it('returns true for a HOST account', () => {
      expect(
        featureFlags.parseUser(
          { accountType: UserAccountType.HOST },
          BASIC_DASHBOARD_FEATURE_FLAG_KEY
        )
      ).toBe(true);
    });

    it('returns true when the account type is missing', () => {
      expect(featureFlags.parseUser({}, BASIC_DASHBOARD_FEATURE_FLAG_KEY)).toBe(
        true
      );
    });
  });

  it('returns true for any unrecognized flag when a user is present', () => {
    expect(
      featureFlags.parseUser(
        {},
        'beta' as unknown as Parameters<typeof featureFlags.parseUser>[1]
      )
    ).toBe(true);
  });
});
