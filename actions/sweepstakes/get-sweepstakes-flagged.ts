'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { FlaggedEntryData } from '@/schemas/index';
import { simulateNetworkDelay } from '@/lib/simulate';

const getSweepstakesFlagged = async (
  sweepstakesId: string
): Promise<FlaggedEntryData[]> => {
  'use cache';
  cacheTag('sweepstakes-flagged');

  await simulateNetworkDelay();

  // Mock flagged entries data for fraud detection
  const mockFlaggedEntries: FlaggedEntryData[] = [
    {
      id: '1',
      userName: 'Suspicious User',
      userEmail: 'fake.user.123@tempmail.com',
      userAvatar: '',
      flaggedAt: '1 hour ago',
      flagReason: 'Multiple entries from same device',
      riskScore: 89,
      entryCount: 12,
      ipAddress: '192.168.1.100',
      location: 'Unknown',
      sweepstakesName: 'iPhone 15 Pro Max Giveaway',
      status: 'pending'
    },
    {
      id: '2',
      userName: 'Bot Account',
      userEmail: 'automated.entry@disposable.email',
      userAvatar: '',
      flaggedAt: '2 hours ago',
      flagReason: 'Suspicious entry velocity',
      riskScore: 94,
      entryCount: 8,
      ipAddress: '10.0.0.50',
      location: 'Proxy Server',
      sweepstakesName: 'iPhone 15 Pro Max Giveaway',
      status: 'pending'
    },
    {
      id: '3',
      userName: 'John Duplicate',
      userEmail: 'john.duplicate@gmail.com',
      userAvatar: '',
      flaggedAt: '3 hours ago',
      flagReason: 'Duplicate email pattern detected',
      riskScore: 76,
      entryCount: 3,
      ipAddress: '203.45.67.89',
      location: 'New York, US',
      sweepstakesName: 'iPhone 15 Pro Max Giveaway',
      status: 'resolved'
    },
    {
      id: '4',
      userName: 'Spam Generator',
      userEmail: 'generated.spam.789@random.com',
      userAvatar: '',
      flaggedAt: '4 hours ago',
      flagReason: 'Failed CAPTCHA multiple times',
      riskScore: 92,
      entryCount: 15,
      ipAddress: '45.123.67.12',
      location: 'VPN Exit Node',
      sweepstakesName: 'iPhone 15 Pro Max Giveaway',
      status: 'blocked'
    },
    {
      id: '5',
      userName: 'Fake Profile',
      userEmail: 'notreal.person@fake.domain',
      userAvatar: '',
      flaggedAt: '5 hours ago',
      flagReason: 'Inconsistent user information',
      riskScore: 81,
      entryCount: 2,
      ipAddress: '178.22.45.67',
      location: 'Unknown',
      sweepstakesName: 'iPhone 15 Pro Max Giveaway',
      status: 'pending'
    }
  ];

  return mockFlaggedEntries;
};

export default getSweepstakesFlagged;
