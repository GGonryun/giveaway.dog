'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { FunnelStageData } from '@/schemas/index';
import { simulateNetworkDelay } from '../shared/utils';

const getSweepstakesFunnel = async (
  sweepstakesId: string
): Promise<FunnelStageData[]> => {
  'use cache';
  cacheTag('sweepstakes-funnel');

  await simulateNetworkDelay();

  // Mock funnel data for conversion tracking
  const mockFunnelData: FunnelStageData[] = [
    { stage: 'Page Views', value: 11230, percentage: 100 },
    { stage: 'Started Entry', value: 2847, percentage: 25.4 },
    { stage: 'Form Submitted', value: 2156, percentage: 75.7 },
    { stage: 'Email Verified', value: 1932, percentage: 89.6 },
    { stage: 'Entry Completed', value: 1789, percentage: 92.6 },
    { stage: 'Social Actions', value: 892, percentage: 49.9 }
  ];

  return mockFunnelData;
};

export default getSweepstakesFunnel;
