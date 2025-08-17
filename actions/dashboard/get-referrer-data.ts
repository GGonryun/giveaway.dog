'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { ReferrerData } from '@/schemas/index';
import { simulateNetworkDelay } from '../shared/utils';

interface GetReferrerDataParams {
  sourceFilter?: string;
}

const getReferrerData = async (
  params: GetReferrerDataParams = {}
): Promise<ReferrerData[]> => {
  'use cache';
  cacheTag('referrer-data');

  await simulateNetworkDelay();

  const mockReferrerData: ReferrerData[] = [
    {
      source: 'Instagram',
      visits: 5420,
      conversions: 387,
      conversionRate: 7.1
    },
    {
      source: 'Twitter/X',
      visits: 4290,
      conversions: 298,
      conversionRate: 6.9
    },
    { source: 'Direct', visits: 2890, conversions: 234, conversionRate: 8.1 },
    { source: 'Facebook', visits: 2340, conversions: 167, conversionRate: 7.1 },
    { source: 'TikTok', visits: 1890, conversions: 145, conversionRate: 7.7 }
  ];

  return mockReferrerData;
};

export default getReferrerData;
