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

// Server Actions
import getDashboardKPIs from '@/actions/dashboard/get-dashboard-kpis';
import getDailyEngagement from '@/actions/dashboard/get-daily-engagement';
import getBotDetection from '@/actions/dashboard/get-bot-detection';
import getConversionFunnel from '@/actions/dashboard/get-conversion-funnel';
import getReferrerData from '@/actions/dashboard/get-referrer-data';
import getActiveSweepstakes from '@/actions/dashboard/get-active-sweepstakes';
import getHeatmapData from '@/actions/dashboard/get-heatmap-data';
import getGeolocationData from '@/actions/dashboard/get-geolocation-data';
import getUserDistribution from '@/actions/dashboard/get-user-distribution';
import getLatestUsers from '@/actions/dashboard/get-latest-users';
import getFlaggedEntries from '@/actions/dashboard/get-flagged-entries';
import getTimeToEntry from '@/actions/dashboard/get-time-to-entry';

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
    <div className="grid gap-6 xl:grid-cols-2">
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
    <div className="grid gap-6 xl:grid-cols-2">
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
    <div className="grid gap-6 xl:grid-cols-2">
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
    <div className="grid gap-6 xl:grid-cols-2">
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
    <div className="space-y-6">
      {/* KPI Cards */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardKPISection />
      </Suspense>

      {/* Main Charts Row */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardEngagementSection />
      </Suspense>

      {/* Secondary Charts Row */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardConversionSection />
      </Suspense>

      {/* Analytics Deep Dive Row */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardGeographicSection />
      </Suspense>

      {/* Additional Analytics Row */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardDistributionSection />
      </Suspense>

      {/* Full Width Management Components */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardActivitySection />
      </Suspense>
    </div>
  );
}
