'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { DistributionData } from '@/schemas/index';
import { simulateNetworkDelay } from '../shared/utils';

const getUserDistribution = async (): Promise<DistributionData[]> => {
  'use cache';
  cacheTag('user-distribution');

  await simulateNetworkDelay();

  const mockDistributionData: DistributionData[] = [
    { entriesRange: '1', userCount: 8943, percentage: 71.2, suspicious: false },
    {
      entriesRange: '2-5',
      userCount: 2134,
      percentage: 17.0,
      suspicious: false
    },
    {
      entriesRange: '6-10',
      userCount: 890,
      percentage: 7.1,
      suspicious: false
    },
    {
      entriesRange: '11-20',
      userCount: 345,
      percentage: 2.8,
      suspicious: true
    },
    {
      entriesRange: '21-50',
      userCount: 156,
      percentage: 1.2,
      suspicious: true
    },
    { entriesRange: '50+', userCount: 89, percentage: 0.7, suspicious: true }
  ];

  return mockDistributionData;
};

export default getUserDistribution;
