import { SweepstakesStatus } from '@prisma/client';
import { z } from 'zod';

export const sweepstakesDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.nativeEnum(SweepstakesStatus),
  entries: z.number(),
  uniqueEntrants: z.number(),
  conversionRate: z.number(),
  botRate: z.number(),
  timeLeft: z.string(),
  createdAt: z.string(),
  topSource: z.string(),
  prize: z.string()
});

export type SweepstakesData = z.infer<typeof sweepstakesDataSchema>;

// ----- TODO -----

// Dashboard KPI Schema
export const DashboardKPIDataSchema = z.object({
  entriesTotal: z.number(),
  entriesChange: z.number(),
  newUsers: z.number(),
  newUsersChange: z.number(),
  activeSweepstakes: z.number(),
  botFilterRate: z.number()
});

export type DashboardKPIData = z.infer<typeof DashboardKPIDataSchema>;

// Daily Engagement Schema
export const DailyEngagementDataSchema = z.object({
  date: z.string(),
  entries: z.number(),
  pageviews: z.number(),
  conversionRate: z.number()
});

export type DailyEngagementData = z.infer<typeof DailyEngagementDataSchema>;

// Bot Detection Schema
export const BotDetectionDataSchema = z.object({
  name: z.string(),
  value: z.number(),
  fill: z.string()
});

export type BotDetectionData = z.infer<typeof BotDetectionDataSchema>;

// Funnel Stage Schema
export const FunnelStageDataSchema = z.object({
  stage: z.string(),
  value: z.number(),
  percentage: z.number()
});

export type FunnelStageData = z.infer<typeof FunnelStageDataSchema>;

// Referrer Data Schema
export const ReferrerDataSchema = z.object({
  source: z.string(),
  visits: z.number(),
  conversions: z.number(),
  conversionRate: z.number()
});

export type ReferrerData = z.infer<typeof ReferrerDataSchema>;

// Active Sweepstakes Schema
export const ActiveSweepstakesDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  entries: z.number(),
  entriesChange24h: z.number(),
  conversionRate: z.number(),
  botRate: z.number(),
  timeLeft: z.string(),
  status: z.enum(['active', 'ending-soon', 'draft', 'completed', 'paused'])
});

export type ActiveSweepstakesData = z.infer<typeof ActiveSweepstakesDataSchema>;

// Heatmap Data Schema
export const HeatmapDataSchema = z.object({
  hour: z.number(),
  day: z.string(),
  entries: z.number(),
  intensity: z.number()
});

export type HeatmapData = z.infer<typeof HeatmapDataSchema>;

// Location Data Schema
export const LocationDataSchema = z.object({
  country: z.string(),
  state: z.string().optional(),
  city: z.string().optional(),
  entries: z.number(),
  percentage: z.number(),
  flag: z.string()
});

export type LocationData = z.infer<typeof LocationDataSchema>;

// Distribution Data Schema
export const DistributionDataSchema = z.object({
  entriesRange: z.string(),
  userCount: z.number(),
  percentage: z.number(),
  suspicious: z.boolean()
});

export type DistributionData = z.infer<typeof DistributionDataSchema>;

// Latest User Data Schema
export const LatestUserDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatar: z.string(),
  emailStatus: z.enum(['verified', 'pending', 'bounced']),
  signupTime: z.string(),
  firstSource: z.string(),
  location: z.string(),
  qualityScore: z.number(),
  entries: z.number()
});

export type LatestUserData = z.infer<typeof LatestUserDataSchema>;

// Flagged Entry Data Schema
export const FlaggedEntryDataSchema = z.object({
  id: z.string(),
  userName: z.string(),
  userEmail: z.string(),
  userAvatar: z.string(),
  flaggedAt: z.string(),
  flagReason: z.string(),
  riskScore: z.number(),
  entryCount: z.number(),
  ipAddress: z.string(),
  location: z.string(),
  sweepstakesName: z.string(),
  status: z.enum(['pending', 'resolved', 'blocked'])
});

export type FlaggedEntryData = z.infer<typeof FlaggedEntryDataSchema>;

// Time to Entry Distribution Schema
export const TimeToEntryDistributionSchema = z.object({
  timeRange: z.string(),
  userCount: z.number(),
  percentage: z.number(),
  avgConversionRate: z.number()
});

export type TimeToEntryDistribution = z.infer<
  typeof TimeToEntryDistributionSchema
>;

// Time to Entry Timeline Schema
export const TimeToEntryTimelineSchema = z.object({
  time: z.string(),
  entries: z.number(),
  avgTime: z.number()
});

export type TimeToEntryTimeline = z.infer<typeof TimeToEntryTimelineSchema>;

// User Analytics Data Schema
export const UserAnalyticsDataSchema = z.object({
  totalUsers: z.number(),
  totalUsersChange: z.number(),
  activeUsers: z.number(),
  activeUsersChange: z.number(),
  qualityScore: z.number(),
  qualityScoreChange: z.number(),
  flaggedUsers: z.number(),
  flaggedUsersChange: z.number(),
  newUsers30d: z.number(),
  newUsers30dChange: z.number(),
  avgEngagement: z.number(),
  avgEngagementChange: z.number(),
  conversionRate: z.number(),
  conversionRateChange: z.number(),
  crmSyncRate: z.number(),
  crmSyncRateChange: z.number()
});

export type UserAnalyticsData = z.infer<typeof UserAnalyticsDataSchema>;

// Sweepstakes Overview Data Schema
export const SweepstakesOverviewDataSchema = z.object({
  totalSweepstakes: z.number(),
  totalSweepstakesChange: z.number(),
  activeSweepstakes: z.number(),
  activeSweepstakesChange: z.number(),
  totalEntries: z.number(),
  totalEntriesChange: z.number(),
  avgConversionRate: z.number(),
  avgConversionRateChange: z.number()
});

export type SweepstakesOverviewData = z.infer<
  typeof SweepstakesOverviewDataSchema
>;

// Organization Data Schema
export const OrganizationDataSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  timezone: z.string(),
  locale: z.string(),
  logo: z.string().optional(),
  brandColor: z.string().optional()
});

export type OrganizationData = z.infer<typeof OrganizationDataSchema>;

// Public Giveaway Item Schema (Marketing)
const PrizeSchema = z.object({
  title: z.string(),
  value: z.string(),
  image: z.string()
});

const HostSchema = z.object({
  name: z.string(),
  avatar: z.string(),
  verified: z.boolean(),
  rating: z.number().optional()
});

const StatsSchema = z.object({
  entries: z.number(),
  timeLeft: z.string(),
  endDate: z.string(),
  daysLeft: z.number(),
  successRate: z.number().optional()
});

const EntryMethodsSchema = z.object({
  total: z.number(),
  types: z.array(z.string()).optional()
});

const RequirementsSchema = z
  .object({
    ageLimit: z.number(),
    verificationRequired: z.boolean(),
    premiumOnly: z.boolean()
  })
  .optional();

export const PublicGiveawayItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  prize: PrizeSchema,
  host: HostSchema,
  stats: StatsSchema,
  thumbnail: z.string(),
  category: z.string(),
  subcategory: z.string().optional(),
  tags: z.array(z.string()),
  status: z.enum(['active', 'ending-soon', 'new', 'hot']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  entryMethods: EntryMethodsSchema,
  eligibleCountries: z.array(z.string()),
  requirements: RequirementsSchema,
  odds: z.string().optional(),
  featured: z.boolean(),
  sponsored: z.boolean().optional()
});

export type PublicGiveawayItem = z.infer<typeof PublicGiveawayItemSchema>;

// Comprehensive User Data Schema
export const UserDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatar: z.string().nullable(),
  region: z.string(),
  entries: z.number(),
  lastEntryAt: z.string(),
  firstEntryAt: z.string(),
  qualityScore: z.number(),
  status: z.enum(['active', 'flagged', 'blocked', 'trusted']),
  engagement: z.number(),
  source: z.string(),
  deviceFingerprint: z.string(),
  emailVerified: z.boolean(),
  disposableEmail: z.boolean(),
  emailStatus: z.enum(['verified', 'pending', 'bounced']).optional(),
  signupTime: z.string().optional(),
  firstSource: z.string().optional(),
  location: z.string().optional()
});

export type UserData = z.infer<typeof UserDataSchema>;
