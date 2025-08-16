'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { simulateNetworkDelay } from '../shared/utils';

interface UserDetailData {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  region: string;
  entries: number;
  lastEntryAt: string;
  firstEntryAt: string;
  qualityScore: number;
  status: 'active' | 'flagged' | 'blocked' | 'trusted';
  engagement: number;
  source: string;
  deviceFingerprint: string;
  emailVerified: boolean;
  disposableEmail: boolean;
  tags: string[];
  // Additional detail fields
  phoneNumber?: string;
  address?: string;
  socialAccounts?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
  entryHistory: {
    sweepstakesId: string;
    sweepstakesTitle: string;
    entryDate: string;
    status: string;
  }[];
  riskFactors: {
    factor: string;
    score: number;
    description: string;
  }[];
}

const getUserDetail = async (userId: string): Promise<UserDetailData> => {
  'use cache';
  cacheTag('user-detail');

  await simulateNetworkDelay();

  // Mock detailed user data
  const mockUserDetail: UserDetailData = {
    id: userId,
    name: `User ${userId}`,
    email: `user${userId}@example.com`,
    avatar: null,
    region: 'US',
    entries: Math.floor(Math.random() * 50) + 1,
    lastEntryAt: new Date(
      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
    firstEntryAt: new Date(
      Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000
    ).toISOString(),
    qualityScore: Math.floor(Math.random() * 40) + 60,
    status: (['active', 'flagged', 'blocked', 'trusted'] as const)[
      Math.floor(Math.random() * 4)
    ],
    engagement: Math.floor(Math.random() * 100),
    source: ['Instagram', 'Twitter', 'Direct', 'Facebook', 'Email'][
      Math.floor(Math.random() * 5)
    ],
    deviceFingerprint: `fp_${Math.random().toString(36).substr(2, 9)}`,
    emailVerified: Math.random() > 0.1,
    disposableEmail: Math.random() > 0.95,
    tags:
      Math.random() > 0.7
        ? ['VIP', 'High Value']
        : Math.random() > 0.9
          ? ['Suspicious']
          : [],
    phoneNumber: '+1-555-0123',
    address: '123 Main St, Anytown, USA 12345',
    socialAccounts: {
      instagram: '@user123',
      twitter: '@user123'
    },
    entryHistory: [
      {
        sweepstakesId: '1',
        sweepstakesTitle: 'iPhone 15 Pro Max Giveaway',
        entryDate: '2025-01-15T10:30:00Z',
        status: 'valid'
      },
      {
        sweepstakesId: '2',
        sweepstakesTitle: 'Gaming Setup Contest',
        entryDate: '2025-01-10T14:20:00Z',
        status: 'valid'
      }
    ],
    riskFactors: [
      {
        factor: 'Email Domain',
        score: 10,
        description: 'Uses common email provider'
      },
      {
        factor: 'Device Fingerprint',
        score: 5,
        description: 'Unique device signature'
      }
    ]
  };

  return mockUserDetail;
};

export default getUserDetail;
