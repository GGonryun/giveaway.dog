'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';

import { ActiveSweepstakesData } from '../shared/types';
import { simulateNetworkDelay } from '../shared/utils';

interface GetActiveSweepstakesParams {
  statusFilter?: string;
}

const getActiveSweepstakes = async (
  params: GetActiveSweepstakesParams = {}
): Promise<ActiveSweepstakesData[]> => {
  'use cache';
  cacheTag('active-sweepstakes');

  await simulateNetworkDelay();

  const mockActiveSweepstakes: ActiveSweepstakesData[] = [
    {
      id: '1',
      title: 'iPhone 15 Pro Max Giveaway',
      entries: 5432,
      entriesChange24h: 234,
      conversionRate: 7.8,
      botRate: 8.2,
      timeLeft: '5 days 12 hours',
      status: 'active'
    },
    {
      id: '2',
      title: 'Gaming Setup Bundle Contest',
      entries: 2890,
      entriesChange24h: -12,
      conversionRate: 6.4,
      botRate: 15.3,
      timeLeft: '2 hours 45 minutes',
      status: 'ending-soon'
    },
    {
      id: '3',
      title: '$500 Amazon Gift Card Sweepstakes',
      entries: 1234,
      entriesChange24h: 89,
      conversionRate: 9.1,
      botRate: 4.7,
      timeLeft: '12 days 6 hours',
      status: 'active'
    }
  ];

  return mockActiveSweepstakes;
};

export default getActiveSweepstakes;
