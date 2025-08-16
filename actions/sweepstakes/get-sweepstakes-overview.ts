'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { SweepstakesOverviewData } from '../shared/types';
import { simulateNetworkDelay } from '../shared/utils';

const getSweepstakesOverview = async (): Promise<SweepstakesOverviewData> => {
  'use cache';
  cacheTag('sweepstakes-overview');

  await simulateNetworkDelay();

  const mockOverviewKPIs: SweepstakesOverviewData = {
    totalSweepstakes: 8,
    totalSweepstakesChange: 14.3,
    activeSweepstakes: 5,
    activeSweepstakesChange: 25.0,
    totalEntries: 15420,
    totalEntriesChange: 18.7,
    avgConversionRate: 7.8,
    avgConversionRateChange: -2.1
  };

  return mockOverviewKPIs;
};

export default getSweepstakesOverview;
