import { describe, it, expect } from 'vitest';
import { userFingerprintSchema, DEVELOPMENT_GEO } from '../fingerprint';

describe('userFingerprintSchema', () => {
  it('accepts string values', () => {
    const value = { ip: '1.2.3.4', userAgent: 'Mozilla', countryCode: 'US' };

    expect(userFingerprintSchema.parse(value)).toEqual(value);
  });

  it('accepts null for every field', () => {
    const value = { ip: null, userAgent: null, countryCode: null };

    expect(userFingerprintSchema.parse(value)).toEqual(value);
  });

  it.each(['ip', 'userAgent', 'countryCode'])(
    'rejects a missing %s',
    (field) => {
      const value: Record<string, unknown> = {
        ip: null,
        userAgent: null,
        countryCode: null
      };
      delete value[field];

      const result = userFingerprintSchema.safeParse(value);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual([field]);
    }
  );

  it('rejects a numeric ip', () => {
    expect(
      userFingerprintSchema.safeParse({
        ip: 1234,
        userAgent: null,
        countryCode: null
      }).success
    ).toBe(false);
  });
});

describe('DEVELOPMENT_GEO', () => {
  it('describes a successful localhost lookup in San Diego, US', () => {
    expect(DEVELOPMENT_GEO).toEqual({
      ip: '127.0.0.1',
      success: true,
      type: 'IPv4',
      continent: 'North America',
      continent_code: 'NA',
      country: 'United States',
      country_code: 'US',
      region: 'California',
      region_code: 'CA',
      city: 'San Diego',
      latitude: 0,
      longitude: 0,
      is_eu: false,
      postal: '92101',
      calling_code: '1',
      capital: 'Washington D.C.',
      borders: 'CA,MX',
      flag: {
        img: 'https://cdn.ipwhois.io/flags/us.svg',
        emoji: '🇺🇸',
        emoji_unicode: 'U+1F1FA U+1F1F8'
      },
      connection: {
        asn: 22773,
        org: 'Cox Communications',
        isp: 'Cox Communications Inc.',
        domain: 'cox.com'
      },
      timezone: {
        id: 'America/Los_Angeles',
        abbr: 'PST',
        is_dst: false,
        offset: -28800,
        utc: '-08:00',
        current_time: '2025-01-01T01:00:00-08:00'
      }
    });
  });

  it('provides values that satisfy the fingerprint schema shape', () => {
    expect(
      userFingerprintSchema.safeParse({
        ip: DEVELOPMENT_GEO.ip,
        userAgent: null,
        countryCode: DEVELOPMENT_GEO.country_code
      }).success
    ).toBe(true);
  });
});
