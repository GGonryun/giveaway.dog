'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { FlaggedEntryData } from '@/schemas/index';
import { simulateNetworkDelay } from '../shared/utils';

const getFlaggedEntries = async (): Promise<FlaggedEntryData[]> => {
  'use cache';
  cacheTag('flagged-entries');

  await simulateNetworkDelay();

  const mockFlaggedEntries: FlaggedEntryData[] = [
    {
      id: '1',
      userName: 'John Smith',
      userEmail: 'john.suspicious@email.com',
      userAvatar: '',
      flaggedAt: '2 hours ago',
      flagReason: 'Multiple entries from same IP',
      riskScore: 85,
      entryCount: 47,
      ipAddress: '192.168.1.1',
      location: 'New York, US',
      sweepstakesName: 'iPhone 15 Pro Max Giveaway',
      status: 'pending'
    },
    {
      id: '2',
      userName: 'Bot Account',
      userEmail: 'fake.bot.123@tempmail.com',
      userAvatar: '',
      flaggedAt: '4 hours ago',
      flagReason: 'Suspicious email pattern',
      riskScore: 92,
      entryCount: 23,
      ipAddress: '10.0.0.1',
      location: 'Unknown',
      sweepstakesName: 'Gaming Setup Bundle Contest',
      status: 'pending'
    }
  ];

  return mockFlaggedEntries;
};

export default getFlaggedEntries;
