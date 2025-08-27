'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { DashboardKPIData } from '@/schemas/index';
import { simulateNetworkDelay } from '@/lib/simulate';

const getDashboardKPIs = async (): Promise<DashboardKPIData> => {
  'use cache';
  cacheTag('dashboard-kpis');

  await simulateNetworkDelay();

  const mockKPIData: DashboardKPIData = {
    entriesTotal: 1247,
    entriesChange: 15.2,
    newUsers: 432,
    newUsersChange: 8.7,
    activeSweepstakes: 3,
    botFilterRate: 12.4
  };

  return mockKPIData;
};

export default getDashboardKPIs;
