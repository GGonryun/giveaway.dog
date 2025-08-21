'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { simulateNetworkDelay } from '@/lib/simulate';

interface TimeSeriesData {
  date: string;
  entries: number;
  uniqueEntrants: number;
  views: number;
  conversionRate: number;
  botEntries: number;
  socialShares: number;
}

const getSweepstakesTimeSeries = async (
  sweepstakesId: string,
  timeRange: string = '7d'
): Promise<TimeSeriesData[]> => {
  'use cache';
  cacheTag('sweepstakes-time-series');

  await simulateNetworkDelay();

  // Mock time series data for temporal analytics
  const mockTimeSeriesData: TimeSeriesData[] = [
    {
      date: '2025-01-08',
      entries: 234,
      uniqueEntrants: 198,
      views: 3420,
      conversionRate: 6.8,
      botEntries: 19,
      socialShares: 45
    },
    {
      date: '2025-01-09',
      entries: 289,
      uniqueEntrants: 243,
      views: 4290,
      conversionRate: 6.7,
      botEntries: 24,
      socialShares: 67
    },
    {
      date: '2025-01-10',
      entries: 345,
      uniqueEntrants: 302,
      views: 5120,
      conversionRate: 6.7,
      botEntries: 28,
      socialShares: 89
    },
    {
      date: '2025-01-11',
      entries: 412,
      uniqueEntrants: 378,
      views: 6340,
      conversionRate: 6.5,
      botEntries: 34,
      socialShares: 112
    },
    {
      date: '2025-01-12',
      entries: 567,
      uniqueEntrants: 498,
      views: 7890,
      conversionRate: 7.2,
      botEntries: 47,
      socialShares: 156
    },
    {
      date: '2025-01-13',
      entries: 623,
      uniqueEntrants: 543,
      views: 8450,
      conversionRate: 7.4,
      botEntries: 51,
      socialShares: 189
    },
    {
      date: '2025-01-14',
      entries: 789,
      uniqueEntrants: 687,
      views: 9720,
      conversionRate: 8.1,
      botEntries: 65,
      socialShares: 234
    },
    {
      date: '2025-01-15',
      entries: 892,
      uniqueEntrants: 789,
      views: 11230,
      conversionRate: 7.9,
      botEntries: 73,
      socialShares: 267
    }
  ];

  return mockTimeSeriesData;
};

export default getSweepstakesTimeSeries;
