// Shared types for server actions

export interface DashboardKPIData {
  entriesTotal: number;
  entriesChange: number;
  newUsers: number;
  newUsersChange: number;
  activeSweepstakes: number;
  botFilterRate: number;
}

export interface DailyEngagementData {
  date: string;
  entries: number;
  pageviews: number;
  conversionRate: number;
}

export interface BotDetectionData {
  name: string;
  value: number;
  fill: string;
}

export interface FunnelStageData {
  stage: string;
  value: number;
  percentage: number;
}

export interface ReferrerData {
  source: string;
  visits: number;
  conversions: number;
  conversionRate: number;
}

export interface ActiveSweepstakesData {
  id: string;
  title: string;
  entries: number;
  entriesChange24h: number;
  conversionRate: number;
  botRate: number;
  timeLeft: string;
  status: 'active' | 'ending-soon' | 'draft' | 'completed' | 'paused';
}

export interface HeatmapData {
  hour: number;
  day: string;
  entries: number;
  intensity: number;
}

export interface LocationData {
  country: string;
  state?: string;
  city?: string;
  entries: number;
  percentage: number;
  flag: string;
}

export interface DistributionData {
  entriesRange: string;
  userCount: number;
  percentage: number;
  suspicious: boolean;
}

export interface LatestUserData {
  id: string;
  name: string;
  email: string;
  avatar: string;
  emailStatus: 'verified' | 'pending' | 'bounced';
  signupTime: string;
  firstSource: string;
  location: string;
  qualityScore: number;
  entries: number;
}

export interface FlaggedEntryData {
  id: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  flaggedAt: string;
  flagReason: string;
  riskScore: number;
  entryCount: number;
  ipAddress: string;
  location: string;
  sweepstakesName: string;
  status: 'pending' | 'resolved' | 'blocked';
}

export interface TimeToEntryDistribution {
  timeRange: string;
  userCount: number;
  percentage: number;
  avgConversionRate: number;
}

export interface TimeToEntryTimeline {
  time: string;
  entries: number;
  avgTime: number;
}

export interface UserAnalyticsData {
  totalUsers: number;
  totalUsersChange: number;
  activeUsers: number;
  activeUsersChange: number;
  qualityScore: number;
  qualityScoreChange: number;
  flaggedUsers: number;
  flaggedUsersChange: number;
  newUsers30d: number;
  newUsers30dChange: number;
  avgEngagement: number;
  avgEngagementChange: number;
  conversionRate: number;
  conversionRateChange: number;
  crmSyncRate: number;
  crmSyncRateChange: number;
}

export interface SweepstakesOverviewData {
  totalSweepstakes: number;
  totalSweepstakesChange: number;
  activeSweepstakes: number;
  activeSweepstakesChange: number;
  totalEntries: number;
  totalEntriesChange: number;
  avgConversionRate: number;
  avgConversionRateChange: number;
}

export interface SweepstakesData {
  id: string;
  title: string;
  status: 'active' | 'ending-soon' | 'draft' | 'completed' | 'paused';
  entries: number;
  uniqueEntrants: number;
  conversionRate: number;
  botRate: number;
  timeLeft: string;
  createdAt: string;
  topSource: string;
  prize: string;
}

export interface OrganizationData {
  name: string;
  slug: string;
  description: string;
  timezone: string;
  locale: string;
  logo?: string;
  brandColor?: string;
}

// Marketing/Public Giveaway Types
export interface PublicGiveawayItem {
  id: string;
  title: string;
  description: string;
  prize: {
    title: string;
    value: string;
    image: string;
  };
  host: {
    name: string;
    avatar: string;
    verified: boolean;
    rating?: number;
  };
  stats: {
    entries: number;
    timeLeft: string;
    endDate: string;
    daysLeft: number;
    successRate?: number;
  };
  thumbnail: string;
  category: string;
  subcategory?: string;
  tags: string[];
  status: 'active' | 'ending-soon' | 'new' | 'hot';
  difficulty: 'easy' | 'medium' | 'hard';
  entryMethods: {
    total: number;
    types?: string[];
  };
  eligibleCountries: string[];
  requirements?: {
    ageLimit: number;
    verificationRequired: boolean;
    premiumOnly: boolean;
  };
  odds?: string;
  featured: boolean;
  sponsored?: boolean;
}
