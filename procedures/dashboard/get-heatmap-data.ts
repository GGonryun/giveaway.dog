'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { HeatmapData } from '@/schemas/index';
import { simulateNetworkDelay } from '@/lib/simulate';

interface GetHeatmapDataParams {
  timeRange?: string;
}

const getHeatmapData = async (
  params: GetHeatmapDataParams = {}
): Promise<HeatmapData[]> => {
  'use cache';
  cacheTag('heatmap-data');

  await simulateNetworkDelay();

  const mockHeatmapData: HeatmapData[] = [
    { hour: 8, day: 'Mon', entries: 45, intensity: 30 },
    { hour: 12, day: 'Mon', entries: 89, intensity: 60 },
    { hour: 20, day: 'Mon', entries: 156, intensity: 90 },
    { hour: 8, day: 'Tue', entries: 67, intensity: 45 },
    { hour: 12, day: 'Tue', entries: 134, intensity: 80 },
    { hour: 20, day: 'Tue', entries: 189, intensity: 95 },
    { hour: 8, day: 'Wed', entries: 78, intensity: 55 },
    { hour: 12, day: 'Wed', entries: 145, intensity: 85 },
    { hour: 20, day: 'Wed', entries: 201, intensity: 100 },
    { hour: 8, day: 'Thu', entries: 123, intensity: 75 },
    { hour: 12, day: 'Thu', entries: 167, intensity: 90 },
    { hour: 20, day: 'Thu', entries: 234, intensity: 100 },
    { hour: 8, day: 'Fri', entries: 98, intensity: 65 },
    { hour: 12, day: 'Fri', entries: 178, intensity: 95 },
    { hour: 20, day: 'Fri', entries: 189, intensity: 95 },
    { hour: 10, day: 'Sat', entries: 134, intensity: 80 },
    { hour: 14, day: 'Sat', entries: 167, intensity: 90 },
    { hour: 18, day: 'Sat', entries: 145, intensity: 85 },
    { hour: 11, day: 'Sun', entries: 89, intensity: 60 },
    { hour: 15, day: 'Sun', entries: 123, intensity: 75 },
    { hour: 19, day: 'Sun', entries: 156, intensity: 90 }
  ];

  return mockHeatmapData;
};

export default getHeatmapData;
