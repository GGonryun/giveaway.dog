import type { Prisma } from '@prisma/client';
import type { USER_SCHEMA_SELECT_QUERY } from '../user';

export type UserPayload = Prisma.UserGetPayload<{
  select: typeof USER_SCHEMA_SELECT_QUERY;
}>;

export const FIXED_CREATED_AT = new Date('2026-01-15T10:00:00.000Z');

export const buildUserPayload = (
  overrides: Partial<UserPayload> = {}
): UserPayload => ({
  id: 'user-1',
  email: 'jane@example.com',
  name: 'Jane',
  image: 'https://example.com/jane.png',
  source: 'SIGNUP',
  createdAt: FIXED_CREATED_AT,
  birthday: new Date('1990-05-01T00:00:00.000Z'),
  agents: [
    {
      id: 'user-agent-1',
      userId: 'user-1',
      agentId: 'agent-1',
      count: 4,
      createdAt: FIXED_CREATED_AT,
      updatedAt: FIXED_CREATED_AT,
      agent: {
        id: 'agent-1',
        agent: 'Mozilla/5.0',
        device: 'desktop',
        os: 'macOS',
        browser: 'Firefox',
        createdAt: FIXED_CREATED_AT,
        updatedAt: FIXED_CREATED_AT
      }
    }
  ],
  ips: [
    {
      id: 'user-ip-1',
      userId: 'user-1',
      ipId: 'ip-1',
      count: 2,
      createdAt: FIXED_CREATED_AT,
      updatedAt: FIXED_CREATED_AT,
      ip: {
        id: 'ip-1',
        ip: '203.0.113.7',
        asn: null,
        isp: null,
        org: null,
        domain: null,
        country: 'Canada',
        countryCode: 'CA',
        continent: 'North America',
        continentCode: 'NA',
        region: 'Ontario',
        regionCode: 'ON',
        city: 'Toronto',
        postal: null,
        callingCode: null,
        latitude: null,
        longitude: null,
        timezone: null,
        createdAt: FIXED_CREATED_AT,
        updatedAt: FIXED_CREATED_AT
      }
    }
  ],
  quality: [
    {
      id: 'quality-1',
      userId: 'user-1',
      score: 72,
      createdAt: FIXED_CREATED_AT,
      updatedAt: FIXED_CREATED_AT
    }
  ],
  emailVerified: new Date('2026-01-16T00:00:00.000Z'),
  accounts: [
    {
      provider: 'google',
      scope: 'openid email',
      label: 'jane@example.com',
      link: 'https://mail.google.com',
      status: 'ACTIVE'
    }
  ],
  onboarded: true,
  accountType: 'PARTICIPANT',
  username: 'jane_doe',
  preferredContactMethod: 'GOOGLE',
  ...overrides
});
