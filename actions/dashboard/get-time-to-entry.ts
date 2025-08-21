'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { TimeToEntryDistribution, TimeToEntryTimeline } from '@/schemas/index';
import { simulateNetworkDelay } from '@/lib/simulate';

interface TimeToEntryData {
  distribution: TimeToEntryDistribution[];
  timeline: TimeToEntryTimeline[];
  averageTime: number;
  medianTime: number;
  conversionByTime: number[];
}

const getTimeToEntry = async (): Promise<TimeToEntryData> => {
  'use cache';
  cacheTag('time-to-entry');

  await simulateNetworkDelay();

  const mockTimeToEntryDistribution: TimeToEntryDistribution[] = [
    {
      timeRange: '0-30s',
      userCount: 3421,
      percentage: 34.2,
      avgConversionRate: 89.3
    },
    {
      timeRange: '30s-2m',
      userCount: 2890,
      percentage: 28.9,
      avgConversionRate: 78.5
    },
    {
      timeRange: '2-5m',
      userCount: 2134,
      percentage: 21.3,
      avgConversionRate: 65.2
    },
    {
      timeRange: '5-10m',
      userCount: 1045,
      percentage: 10.5,
      avgConversionRate: 42.8
    },
    {
      timeRange: '10m+',
      userCount: 510,
      percentage: 5.1,
      avgConversionRate: 23.1
    }
  ];

  const mockTimeToEntryTimeline: TimeToEntryTimeline[] = [
    { time: 'Mon', entries: 1234, avgTime: 87 },
    { time: 'Tue', entries: 1456, avgTime: 92 },
    { time: 'Wed', entries: 1678, avgTime: 78 },
    { time: 'Thu', entries: 1890, avgTime: 65 },
    { time: 'Fri', entries: 1567, avgTime: 89 },
    { time: 'Sat', entries: 1345, avgTime: 95 },
    { time: 'Sun', entries: 1123, avgTime: 105 }
  ];

  return {
    distribution: mockTimeToEntryDistribution,
    timeline: mockTimeToEntryTimeline,
    averageTime: 87,
    medianTime: 65,
    conversionByTime: [89.3, 78.5, 65.2, 42.8, 23.1]
  };
};

export default getTimeToEntry;
