import z from 'zod';

export const userFingerprintSchema = z.object({
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  countryCode: z.string().nullable()
});

export type UserFingerprint = z.infer<typeof userFingerprintSchema>;

export const DEFAULT_DEVELOPMENT_FINGERPRINT: UserFingerprint = {
  ip: '127.0.0.1',
  userAgent: 'development',
  countryCode: 'US'
};

export const DEVELOPMENT_GEO = {
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
  latitude: 0.0,
  longitude: 0.0,
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
};
