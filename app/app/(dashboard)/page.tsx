'use client';

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

// Mock data - in real app, this would come from API/database
const mockKPIData = {
  entriesTotal: 1247,
  entriesChange: 15.2,
  newUsers: 432,
  newUsersChange: 8.7,
  activeSweepstakes: 3,
  botFilterRate: 12.4
};

const mockDailyEngagement = [
  { date: '2025-01-01', entries: 145, pageviews: 2340, conversionRate: 6.2 },
  { date: '2025-01-02', entries: 167, pageviews: 2890, conversionRate: 5.8 },
  { date: '2025-01-03', entries: 203, pageviews: 3120, conversionRate: 6.5 },
  { date: '2025-01-04', entries: 189, pageviews: 2950, conversionRate: 6.4 },
  { date: '2025-01-05', entries: 234, pageviews: 3450, conversionRate: 6.8 },
  { date: '2025-01-06', entries: 187, pageviews: 2780, conversionRate: 6.7 },
  { date: '2025-01-07', entries: 221, pageviews: 3210, conversionRate: 6.9 }
];

const mockBotDetection = [
  { name: 'Legitimate Entries', value: 1089, fill: 'hsl(142, 76%, 36%)' },
  { name: 'Filtered/Bot Entries', value: 158, fill: 'hsl(0, 84%, 60%)' }
];

const mockFunnelData = [
  { stage: 'Page Visits', value: 15420, percentage: 100 },
  { stage: 'Started Entry', value: 3890, percentage: 25.2 },
  { stage: 'Completed Form', value: 2340, percentage: 60.1 },
  { stage: 'Email Verified', value: 1890, percentage: 80.8 },
  { stage: 'Converted/Paid', value: 1247, percentage: 66.0 }
];

const mockReferrerData = [
  { source: 'Instagram', visits: 5420, conversions: 387, conversionRate: 7.1 },
  { source: 'Twitter/X', visits: 4290, conversions: 298, conversionRate: 6.9 },
  { source: 'Direct', visits: 2890, conversions: 234, conversionRate: 8.1 },
  { source: 'Facebook', visits: 2340, conversions: 167, conversionRate: 7.1 },
  { source: 'TikTok', visits: 1890, conversions: 145, conversionRate: 7.7 }
];

const mockActiveSweepstakes = [
  {
    id: '1',
    title: 'iPhone 15 Pro Max Giveaway',
    entries: 5432,
    entriesChange24h: 234,
    conversionRate: 7.8,
    botRate: 8.2,
    timeLeft: '5 days 12 hours',
    status: 'active' as const
  },
  {
    id: '2',
    title: 'Gaming Setup Bundle Contest',
    entries: 2890,
    entriesChange24h: -12,
    conversionRate: 6.4,
    botRate: 15.3,
    timeLeft: '2 hours 45 minutes',
    status: 'ending-soon' as const
  },
  {
    id: '3',
    title: '$500 Amazon Gift Card Sweepstakes',
    entries: 1234,
    entriesChange24h: 89,
    conversionRate: 9.1,
    botRate: 4.7,
    timeLeft: '12 days 6 hours',
    status: 'active' as const
  }
];

// Mock data for new components
const mockHeatmapData = [
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

const mockLocationData = [
  {
    country: 'United States',
    state: 'California',
    entries: 2340,
    percentage: 18.7,
    flag: '🇺🇸'
  },
  {
    country: 'United States',
    state: 'Texas',
    entries: 1890,
    percentage: 15.1,
    flag: '🇺🇸'
  },
  {
    country: 'United States',
    state: 'New York',
    entries: 1567,
    percentage: 12.5,
    flag: '🇺🇸'
  },
  {
    country: 'Canada',
    state: 'Ontario',
    entries: 890,
    percentage: 7.1,
    flag: '🇨🇦'
  },
  { country: 'United Kingdom', entries: 567, percentage: 4.5, flag: '🇬🇧' },
  { country: 'Australia', entries: 456, percentage: 3.6, flag: '🇦🇺' },
  { country: 'Germany', entries: 345, percentage: 2.8, flag: '🇩🇪' },
  { country: 'France', entries: 234, percentage: 1.9, flag: '🇫🇷' },
  { country: 'Japan', entries: 189, percentage: 1.5, flag: '🇯🇵' },
  { country: 'Brazil', entries: 156, percentage: 1.2, flag: '🇧🇷' }
];

const mockDistributionData = [
  { entriesRange: '1', userCount: 8943, percentage: 71.2, suspicious: false },
  { entriesRange: '2-5', userCount: 2134, percentage: 17.0, suspicious: false },
  { entriesRange: '6-10', userCount: 890, percentage: 7.1, suspicious: false },
  { entriesRange: '11-20', userCount: 345, percentage: 2.8, suspicious: true },
  { entriesRange: '21-50', userCount: 156, percentage: 1.2, suspicious: true },
  { entriesRange: '50+', userCount: 89, percentage: 0.7, suspicious: true }
];

const mockLatestUsers = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    avatar: '',
    emailStatus: 'verified' as const,
    signupTime: '2 minutes ago',
    firstSource: 'Instagram',
    location: 'California, US',
    qualityScore: 85,
    entries: 2
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.chen@gmail.com',
    avatar: '',
    emailStatus: 'pending' as const,
    signupTime: '8 minutes ago',
    firstSource: 'Twitter/X',
    location: 'Toronto, CA',
    qualityScore: 92,
    entries: 1
  },
  {
    id: '3',
    name: 'Emma Williams',
    email: 'emma.w@outlook.com',
    avatar: '',
    emailStatus: 'verified' as const,
    signupTime: '15 minutes ago',
    firstSource: 'Direct',
    location: 'London, UK',
    qualityScore: 78,
    entries: 3
  },
  {
    id: '4',
    name: 'Alex Rodriguez',
    email: 'alex.r@proton.me',
    avatar: '',
    emailStatus: 'bounced' as const,
    signupTime: '23 minutes ago',
    firstSource: 'Facebook',
    location: 'Miami, US',
    qualityScore: 45,
    entries: 1
  }
];

const mockFlaggedEntries = [
  {
    id: '1',
    userName: 'John Smith',
    userEmail: 'john.suspicious@email.com',
    userAvatar: '',
    flaggedAt: '2 hours ago',
    flagReason: 'Multiple entries from same IP',
    riskScore: 85,
    entryCount: 47,
    ipAddress: '192.168.1.1',
    location: 'New York, US',
    sweepstakesName: 'iPhone 15 Pro Max Giveaway',
    status: 'pending' as const
  },
  {
    id: '2',
    userName: 'Bot Account',
    userEmail: 'fake.bot.123@tempmail.com',
    userAvatar: '',
    flaggedAt: '4 hours ago',
    flagReason: 'Suspicious email pattern',
    riskScore: 92,
    entryCount: 23,
    ipAddress: '10.0.0.1',
    location: 'Unknown',
    sweepstakesName: 'Gaming Setup Bundle Contest',
    status: 'pending' as const
  }
];

const mockTimeToEntryDistribution = [
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

const mockTimeToEntryTimeline = [
  { time: 'Mon', entries: 1234, avgTime: 87 },
  { time: 'Tue', entries: 1456, avgTime: 92 },
  { time: 'Wed', entries: 1678, avgTime: 78 },
  { time: 'Thu', entries: 1890, avgTime: 65 },
  { time: 'Fri', entries: 1567, avgTime: 89 },
  { time: 'Sat', entries: 1345, avgTime: 95 },
  { time: 'Sun', entries: 1123, avgTime: 105 }
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <DashboardKPICards data={mockKPIData} />

      {/* Main Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DailyEngagementChart data={mockDailyEngagement} />
        <BotDetectionPieChart
          data={mockBotDetection}
          totalEntries={mockBotDetection.reduce(
            (sum, item) => sum + item.value,
            0
          )}
        />
      </div>

      {/* Secondary Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ConversionFunnelChart data={mockFunnelData} />
        <EntryVelocityHeatmap data={mockHeatmapData} />
      </div>

      {/* Analytics Deep Dive Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TimeToEntryAnalytics
          distributionData={mockTimeToEntryDistribution}
          timelineData={mockTimeToEntryTimeline}
          averageTime={87}
          medianTime={65}
          conversionByTime={[89.3, 78.5, 65.2, 42.8, 23.1]}
        />
        <GeolocationMap data={mockLocationData} />
      </div>

      {/* Additional Analytics Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UserDistributionHistogram data={mockDistributionData} />
        <ReferrersBarChart data={mockReferrerData} />
      </div>

      {/* Full Width Management Components */}
      <LatestUsersFeed users={mockLatestUsers} />
      <ActiveSweepstakesList sweepstakes={mockActiveSweepstakes} />
      <FlaggedEntriesList entries={mockFlaggedEntries} />
    </div>
  );
}
