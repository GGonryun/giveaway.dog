'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { UserAnalyticsData } from '../shared/types';
import { simulateNetworkDelay } from '../shared/utils';

const getUserAnalytics = async (): Promise<UserAnalyticsData> => {
  'use cache';
  cacheTag('user-analytics');

  await simulateNetworkDelay();

  const mockKPIs: UserAnalyticsData = {
    totalUsers: 127459,
    totalUsersChange: 12.5,
    activeUsers: 89234,
    activeUsersChange: 8.3,
    qualityScore: 92.4,
    qualityScoreChange: 2.1,
    flaggedUsers: 1247,
    flaggedUsersChange: -15.2,
    newUsers30d: 23456,
    newUsers30dChange: 18.7,
    avgEngagement: 67.8,
    avgEngagementChange: 5.4,
    conversionRate: 15.2,
    conversionRateChange: 3.8,
    crmSyncRate: 98.5,
    crmSyncRateChange: 1.2
  };

  return mockKPIs;
};

export default getUserAnalytics;
