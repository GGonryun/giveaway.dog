'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { DailyEngagementData } from '@/schemas/index';
import { simulateNetworkDelay } from '../shared/utils';

interface GetDailyEngagementParams {
  startDate?: string;
  endDate?: string;
}

const getDailyEngagement = async (
  params: GetDailyEngagementParams = {}
): Promise<DailyEngagementData[]> => {
  'use cache';
  cacheTag('daily-engagement');

  await simulateNetworkDelay();

  const mockDailyEngagement: DailyEngagementData[] = [
    { date: '2025-01-01', entries: 145, pageviews: 2340, conversionRate: 6.2 },
    { date: '2025-01-02', entries: 167, pageviews: 2890, conversionRate: 5.8 },
    { date: '2025-01-03', entries: 203, pageviews: 3120, conversionRate: 6.5 },
    { date: '2025-01-04', entries: 189, pageviews: 2950, conversionRate: 6.4 },
    { date: '2025-01-05', entries: 234, pageviews: 3450, conversionRate: 6.8 },
    { date: '2025-01-06', entries: 187, pageviews: 2780, conversionRate: 6.7 },
    { date: '2025-01-07', entries: 221, pageviews: 3210, conversionRate: 6.9 }
  ];

  return mockDailyEngagement;
};

export default getDailyEngagement;
