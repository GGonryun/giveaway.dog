'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { FunnelStageData } from '../shared/types';
import { simulateNetworkDelay } from '../shared/utils';

interface GetConversionFunnelParams {
  timeRange?: string;
}

const getConversionFunnel = async (
  params: GetConversionFunnelParams = {}
): Promise<FunnelStageData[]> => {
  'use cache';
  cacheTag('conversion-funnel');

  await simulateNetworkDelay();

  const mockFunnelData: FunnelStageData[] = [
    { stage: 'Page Visits', value: 15420, percentage: 100 },
    { stage: 'Started Entry', value: 3890, percentage: 25.2 },
    { stage: 'Completed Form', value: 2340, percentage: 60.1 },
    { stage: 'Email Verified', value: 1890, percentage: 80.8 },
    { stage: 'Converted/Paid', value: 1247, percentage: 66.0 }
  ];

  return mockFunnelData;
};

export default getConversionFunnel;
