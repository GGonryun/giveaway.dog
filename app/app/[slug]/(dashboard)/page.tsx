import { Suspense } from 'react';
import { DashboardKPICards } from './components/dashboard-kpi-cards';
import { DailyEngagementChart } from './components/daily-engagement-chart';
import { BotDetectionPieChart } from './components/bot-detection-pie-chart';
import { ConversionFunnelChart } from './components/conversion-funnel-chart';
import { ReferrersBarChart } from './components/referrers-bar-chart';
import { ActiveSweepstakesList } from './components/active-sweepstakes-list';
import { EntryVelocityHeatmap } from './components/entry-velocity-heatmap';
import { GeolocationMap } from './components/geolocation-map';
import { UserDistributionHistogram } from './components/user-distribution-histogram';
import { LatestUsersFeed } from './components/latest-users-feed';
import { FlaggedEntriesList } from './components/flagged-entries-list';
import { TimeToEntryAnalytics } from './components/time-to-entry-analytics';

import getDashboardKPIs from '@/procedures/dashboard/get-dashboard-kpis';
import getDailyEngagement from '@/procedures/dashboard/get-daily-engagement';
import getBotDetection from '@/procedures/dashboard/get-bot-detection';
import getConversionFunnel from '@/procedures/dashboard/get-conversion-funnel';
import getReferrerData from '@/procedures/dashboard/get-referrer-data';
import getActiveSweepstakes from '@/procedures/dashboard/get-active-sweepstakes';
import getHeatmapData from '@/procedures/dashboard/get-heatmap-data';
import getGeolocationData from '@/procedures/dashboard/get-geolocation-data';
import getUserDistribution from '@/procedures/dashboard/get-user-distribution';
import getLatestUsers from '@/procedures/dashboard/get-latest-users';
import getFlaggedEntries from '@/procedures/dashboard/get-flagged-entries';
import getTimeToEntry from '@/procedures/dashboard/get-time-to-entry';

// Server component for KPI Cards
async function DashboardKPISection() {
  const kpiData = await getDashboardKPIs();
  return <DashboardKPICards data={kpiData} />;
}

// Server component for Engagement Charts
async function DashboardEngagementSection() {
  const [dailyEngagementData, botDetectionData] = await Promise.all([
    getDailyEngagement(),
    getBotDetection()
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DailyEngagementChart data={dailyEngagementData} />
      <BotDetectionPieChart
        data={botDetectionData}
        totalEntries={botDetectionData.reduce(
          (sum: number, item: any) => sum + item.value,
          0
        )}
      />
    </div>
  );
}

// Server component for Conversion Analytics
async function DashboardConversionSection() {
  const [funnelData, heatmapData] = await Promise.all([
    getConversionFunnel(),
    getHeatmapData()
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ConversionFunnelChart data={funnelData} />
      <EntryVelocityHeatmap data={heatmapData} />
    </div>
  );
}

// Server component for Geographic Analytics
async function DashboardGeographicSection() {
  const [timeToEntryData, geoData] = await Promise.all([
    getTimeToEntry(),
    getGeolocationData()
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <TimeToEntryAnalytics
        distributionData={timeToEntryData.distribution}
        timelineData={timeToEntryData.timeline}
        averageTime={timeToEntryData.averageTime}
        medianTime={timeToEntryData.medianTime}
        conversionByTime={timeToEntryData.conversionByTime}
      />
      <GeolocationMap data={geoData} />
    </div>
  );
}

// Server component for Distribution Analytics
async function DashboardDistributionSection() {
  const [userDistributionData, referrerData] = await Promise.all([
    getUserDistribution(),
    getReferrerData()
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <UserDistributionHistogram data={userDistributionData} />
      <ReferrersBarChart data={referrerData} />
    </div>
  );
}

// Server component for Activity Feed
async function DashboardActivitySection() {
  const [latestUsersData, activeSweepstakesData, flaggedEntriesData] =
    await Promise.all([
      getLatestUsers(),
      getActiveSweepstakes(),
      getFlaggedEntries()
    ]);

  return (
    <>
      <LatestUsersFeed users={latestUsersData} />
      <ActiveSweepstakesList sweepstakes={activeSweepstakesData} />
      <FlaggedEntriesList entries={flaggedEntriesData} />
    </>
  );
}

// Loading skeleton components
function DashboardSkeleton() {
  return <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />;
}

export default function DashboardPage() {
  return (
    <div className="w-full max-w-none space-y-4 md:space-y-6">
      {/* KPI Cards */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardKPISection />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardEngagementSection />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardConversionSection />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardGeographicSection />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardDistributionSection />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardActivitySection />
      </Suspense>
    </div>
  );
}
