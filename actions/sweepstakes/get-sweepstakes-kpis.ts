'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { simulateNetworkDelay } from '../shared/utils';

interface SweepstakesKPIData {
  totalEntries: number;
  totalEntriesChange: number;
  uniqueEntrants: number;
  uniqueEntrantsChange: number;
  conversionRate: number;
  conversionRateChange: number;
  averageTimeToEntry: number;
  averageTimeToEntryChange: number;
  botDetectionRate: number;
  botDetectionRateChange: number;
  viralityScore: number;
  viralityScoreChange: number;
  engagementRate: number;
  engagementRateChange: number;
  qualityScore: number;
  qualityScoreChange: number;
}

const getSweepstakesKPIs = async (
  sweepstakesId: string
): Promise<SweepstakesKPIData> => {
  'use cache';
  cacheTag('sweepstakes-kpis');

  await simulateNetworkDelay();

  // Mock KPI data for individual sweepstakes
  const mockKPIData: SweepstakesKPIData = {
    totalEntries: 5432,
    totalEntriesChange: 18.7,
    uniqueEntrants: 4789,
    uniqueEntrantsChange: 15.2,
    conversionRate: 7.8,
    conversionRateChange: -2.1,
    averageTimeToEntry: 42,
    averageTimeToEntryChange: -8.3,
    botDetectionRate: 8.2,
    botDetectionRateChange: 12.5,
    viralityScore: 6.4,
    viralityScoreChange: 23.1,
    engagementRate: 12.7,
    engagementRateChange: 5.8,
    qualityScore: 87.3,
    qualityScoreChange: 3.2
  };

  return mockKPIData;
};

export default getSweepstakesKPIs;
