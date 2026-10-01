import {
  AccountStatus,
  IdentityProvider,
  Prisma,
  UserAccountType,
  UserSource,
  type User
} from '@prisma/client';
import { USER_SCHEMA_SELECT_QUERY } from '@/schemas/user';

export type UserRow = Prisma.UserGetPayload<{
  select: typeof USER_SCHEMA_SELECT_QUERY;
}>;

const CREATED_AT = new Date('2026-01-15T00:00:00.000Z');
const UPDATED_AT = new Date('2026-02-01T00:00:00.000Z');

export const userRow = (overrides: Partial<UserRow> = {}): UserRow => ({
  id: 'user-2',
  email: 'jane@example.com',
  name: 'Jane Doe',
  image: 'https://example.com/jane.png',
  source: UserSource.SIGNUP,
  createdAt: CREATED_AT,
  birthday: new Date('1990-05-20T00:00:00.000Z'),
  agents: [
    {
      id: 'user-agent-1',
      userId: 'user-2',
      agentId: 'agent-1',
      count: 3,
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      agent: {
        id: 'agent-1',
        agent: 'Mozilla/5.0',
        device: 'desktop',
        os: 'macOS',
        browser: 'Safari',
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT
      }
    }
  ],
  ips: [
    {
      id: 'user-ip-1',
      userId: 'user-2',
      ipId: 'ip-1',
      count: 1,
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      ip: {
        id: 'ip-1',
        ip: '203.0.113.5',
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
        timezone: 'America/Toronto',
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT
      }
    }
  ],
  quality: [
    {
      id: 'quality-1',
      userId: 'user-2',
      score: 72,
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT
    }
  ],
  emailVerified: new Date('2026-01-16T00:00:00.000Z'),
  accounts: [
    {
      provider: 'twitter',
      scope: 'tweet.read users.read',
      label: '@jane',
      link: 'https://x.com/jane',
      status: AccountStatus.ACTIVE
    }
  ],
  onboarded: true,
  accountType: UserAccountType.PARTICIPANT,
  username: 'jane',
  preferredContactMethod: IdentityProvider.TWITTER,
  ...overrides
});

export const mappedUser = () => ({
  id: 'user-2',
  email: 'jane@example.com',
  name: 'Jane Doe',
  image: 'https://example.com/jane.png',
  source: UserSource.SIGNUP,
  birthday: new Date('1990-05-20T00:00:00.000Z'),
  createdAt: CREATED_AT,
  countryCode: 'CA',
  userAgent: 'agent-1',
  qualityScore: 72,
  emailVerified: true,
  providers: [
    {
      type: IdentityProvider.TWITTER,
      scopes: ['tweet.read', 'users.read'],
      label: '@jane',
      link: 'https://x.com/jane',
      status: AccountStatus.ACTIVE
    }
  ],
  onboarded: true,
  accountType: UserAccountType.PARTICIPANT,
  username: 'jane',
  preferredContactMethod: IdentityProvider.TWITTER,
  isAnonymous: false
});

export const userSelectArgs = (id: string) => ({
  where: { id },
  select: USER_SCHEMA_SELECT_QUERY
});

export const dbUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  emailVerified: null,
  username: 'testuser',
  birthday: null,
  image: null,
  emoji: null,
  onboarded: false,
  accountType: UserAccountType.PARTICIPANT,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
  source: UserSource.SIGNUP,
  preferredContactMethod: null,
  ...overrides
});
