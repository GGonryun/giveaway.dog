'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { ReferrerData } from '../shared/types';
import { simulateNetworkDelay } from '../shared/utils';

const getSweepstakesReferrers = async (
  sweepstakesId: string
): Promise<ReferrerData[]> => {
  'use cache';
  cacheTag('sweepstakes-referrers');

  await simulateNetworkDelay();

  // Mock referrer data for traffic source analysis
  const mockReferrerData: ReferrerData[] = [
    {
      source: 'Instagram',
      visits: 3420,
      conversions: 267,
      conversionRate: 7.8
    },
    {
      source: 'Twitter/X',
      visits: 2890,
      conversions: 198,
      conversionRate: 6.9
    },
    { source: 'YouTube', visits: 2340, conversions: 187, conversionRate: 8.0 },
    { source: 'TikTok', visits: 1890, conversions: 134, conversionRate: 7.1 },
    { source: 'Facebook', visits: 1567, conversions: 112, conversionRate: 7.1 },
    { source: 'Direct', visits: 1234, conversions: 98, conversionRate: 7.9 },
    { source: 'Email', visits: 987, conversions: 89, conversionRate: 9.0 },
    { source: 'Reddit', visits: 745, conversions: 56, conversionRate: 7.5 },
    { source: 'Pinterest', visits: 623, conversions: 43, conversionRate: 6.9 },
    { source: 'LinkedIn', visits: 456, conversions: 32, conversionRate: 7.0 },
    { source: 'Snapchat', visits: 345, conversions: 23, conversionRate: 6.7 },
    { source: 'Discord', visits: 234, conversions: 18, conversionRate: 7.7 },
    { source: 'Twitch', visits: 189, conversions: 14, conversionRate: 7.4 },
    { source: 'Other', visits: 156, conversions: 11, conversionRate: 7.1 }
  ];

  return mockReferrerData;
};

export default getSweepstakesReferrers;
