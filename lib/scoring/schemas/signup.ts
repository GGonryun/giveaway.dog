import { ApplicationError, assertNever } from '@/lib/errors';
import { widetype } from '@/lib/widetype';
import { Prisma } from '@prisma/client';
import { clamp } from 'lodash';
import {
  CloudAlert,
  CloudCheck,
  Activity,
  Cable,
  Clock,
  EarthLock,
  FileStack,
  LucideIcon,
  Mail,
  MonitorSmartphone,
  MonitorX,
  StarIcon,
  ShieldCheck
} from 'lucide-react';
import z from 'zod';
import { twitterScoreMetricsSchema, TwitterScoreMetrics } from './twitter';
import { blueskyScoreMetricsSchema, BlueskyScoreMetrics } from './bluesky';
import { discordScoreMetricsSchema, DiscordScoreMetrics } from './discord';

export const USER_BASE_SCORE = 30;
export const MAX_SCORING_REQUESTS_PER_RUN = 15;
export const MAX_TRACKING_REQUESTS_PER_RUN = 10;
export const COMPLETION_THRESHOLD_DAYS = 30;
export const IP_ADDRESS_THRESHOLD_DAYS = 30;
export const MAX_DEVICE_STABILITY_BONUS = 20;
export const PER_DEVICE_STABILITY_BONUS = 2;
export const DEVICE_STABILITY_BONUS_STEP = 10;
export const MAX_IP_CONSISTENCY_BONUS = 20;
export const PER_ADDITIONAL_IP_PENALTY = 5;
export const MAX_GEO_CONSISTENCY_BONUS = 10;
export const GEO_COUNTRY_BONUS = 5;
export const GEO_CONTINENT_BONUS = 2;
export const MAX_PROVIDERS_CONNECTED_BONUS = 10;
export const PER_PROVIDER_BONUS = 2;
export const MAX_EMAIL_VERIFIED_BONUS = 10;
export const MAX_TASK_ACTIVITY_BONUS = 10;
export const PER_TASK_BONUS = 3;
export const MAX_TASK_DIVERSITY_BONUS = 10;
export const MAX_ACCOUNT_AGE_BONUS = 10;
export const MAX_IP_CONSISTENCY_PUNISHMENT = -30;
export const MAX_FINGERPRINT_CONSISTENCY_PUNISHMENT = -30;
export const MAX_TURNSTILE_TRUST_BONUS = 10;
export const MIN_TURNSTILE_TRUST_PENALTY = -10;

export const userScoreMetricsSchema = z.object({
  baseScore: z.number(),
  deviceStability: z.number(),
  ipConsistency: z.number(),
  geoConsistency: z.number(),
  providersConnected: z.number(),
  emailVerified: z.number(),
  taskActivity: z.number(),
  taskDiversity: z.number(),
  accountAge: z.number(),
  overlappingIpAddresses: z.number(),
  overlappingFingerprints: z.number(),
  turnstileTrust: z.number()
});

export type UserScoreMetricsSchema = z.infer<typeof userScoreMetricsSchema>;
export type UserScoreMetricKey = keyof UserScoreMetricsSchema;

export const USER_METRIC_TYPE: Record<
  UserScoreMetricKey,
  'quality' | 'risk' | 'bonus'
> = {
  baseScore: 'bonus',
  deviceStability: 'quality',
  ipConsistency: 'quality',
  geoConsistency: 'quality',
  providersConnected: 'quality',
  emailVerified: 'quality',
  taskActivity: 'quality',
  taskDiversity: 'quality',
  accountAge: 'quality',
  turnstileTrust: 'quality',
  overlappingIpAddresses: 'risk',
  overlappingFingerprints: 'risk'
};

export const USER_QUALITY_METRICS: UserScoreMetricKey[] = widetype
  .keys(USER_METRIC_TYPE)
  .filter((key) => USER_METRIC_TYPE[key] === 'quality');

export const USER_RISK_METRICS: UserScoreMetricKey[] = widetype
  .keys(USER_METRIC_TYPE)
  .filter((key) => USER_METRIC_TYPE[key] === 'risk');

export const USER_BONUS_METRICS: UserScoreMetricKey[] = widetype
  .keys(USER_METRIC_TYPE)
  .filter((key) => USER_METRIC_TYPE[key] === 'bonus');

export const USER_METRIC_LABELS: Record<UserScoreMetricKey, string> = {
  baseScore: 'Base Score',
  deviceStability: 'Device Stability',
  ipConsistency: 'IP Consistency',
  geoConsistency: 'Geolocation Consistency',
  providersConnected: 'Providers Connected',
  emailVerified: 'Email Verified',
  taskActivity: 'Task Activity',
  taskDiversity: 'Task Diversity',
  accountAge: 'Account Age',
  overlappingIpAddresses: 'Overlapping IPs',
  overlappingFingerprints: 'Overlapping Device Fingerprints',
  turnstileTrust: 'Captcha Verification Trust'
};

export const USER_METRIC_ICONS: Record<UserScoreMetricKey, LucideIcon> = {
  baseScore: StarIcon,
  deviceStability: MonitorSmartphone,
  ipConsistency: CloudCheck,
  geoConsistency: EarthLock,
  providersConnected: Cable,
  emailVerified: Mail,
  taskActivity: Activity,
  taskDiversity: FileStack,
  accountAge: Clock,
  overlappingIpAddresses: CloudAlert,
  overlappingFingerprints: MonitorX,
  turnstileTrust: ShieldCheck
};

export const USER_METRIC_MAX: Record<UserScoreMetricKey, number> = {
  baseScore: USER_BASE_SCORE,
  deviceStability: MAX_DEVICE_STABILITY_BONUS,
  ipConsistency: MAX_IP_CONSISTENCY_BONUS,
  geoConsistency: MAX_GEO_CONSISTENCY_BONUS,
  providersConnected: MAX_PROVIDERS_CONNECTED_BONUS,
  emailVerified: MAX_EMAIL_VERIFIED_BONUS,
  taskActivity: MAX_TASK_ACTIVITY_BONUS,
  taskDiversity: MAX_TASK_DIVERSITY_BONUS,
  accountAge: MAX_ACCOUNT_AGE_BONUS,
  overlappingIpAddresses: MAX_IP_CONSISTENCY_PUNISHMENT,
  overlappingFingerprints: MAX_FINGERPRINT_CONSISTENCY_PUNISHMENT,
  turnstileTrust: MAX_TURNSTILE_TRUST_BONUS
};

export const USER_METRIC_DESCRIPTION: Record<UserScoreMetricKey, string> = {
  baseScore: `The foundational score assigned to all users, representing their initial trustworthiness on the platform. Fixed at +${USER_BASE_SCORE} points.`,
  deviceStability: `Measures how consistently the user accesses the platform from the same devices over time. Higher stability indicates a more trustworthy user. Awards +${PER_DEVICE_STABILITY_BONUS} points per ${DEVICE_STABILITY_BONUS_STEP}% device consistency (max +${MAX_DEVICE_STABILITY_BONUS} points).`,
  ipConsistency: `Assesses the consistency of IP addresses used by the user. Frequent changes in IP addresses may indicate suspicious activity. Starts at +${MAX_IP_CONSISTENCY_BONUS} points for 1 IP, then -${PER_ADDITIONAL_IP_PENALTY} points for each additional IP in last ${IP_ADDRESS_THRESHOLD_DAYS} days (min 0 points).`,
  geoConsistency: `Evaluates the geographical locations from which the user accesses the platform. Consistent locations suggest a more reliable user. Awards +${MAX_GEO_CONSISTENCY_BONUS} points for same region, +${GEO_COUNTRY_BONUS} points for same country, or +${GEO_CONTINENT_BONUS} points for same continent.`,
  providersConnected: `Counts the number of unique service providers (e.g., email, social media) linked to the user account. More connections can enhance trustworthiness. Awards +${PER_PROVIDER_BONUS} points per provider connected (max +${MAX_PROVIDERS_CONNECTED_BONUS} points).`,
  emailVerified: `Indicates whether the user has verified their email address. A verified email adds credibility to the user profile. Awards +${MAX_EMAIL_VERIFIED_BONUS} points when verified.`,
  taskActivity: `Tracks the number of tasks completed by the user in the last ${COMPLETION_THRESHOLD_DAYS} days. Higher activity levels suggest an engaged and genuine user. Awards +1 point per ${PER_TASK_BONUS} tasks completed (max +${MAX_TASK_ACTIVITY_BONUS} points).`,
  taskDiversity: `Measures the variety of different tasks completed by the user. A diverse task history indicates a more authentic user. Awards +1 point per unique task type completed (max +${MAX_TASK_DIVERSITY_BONUS} points).`,
  accountAge: `Calculates the age of the user account. Older accounts are generally more trustworthy than newly created ones. Awards +1 point per 7 days after the first week (max +${MAX_ACCOUNT_AGE_BONUS} points).`,
  overlappingIpAddresses: `Identifies if the user shares IP addresses with other accounts. Overlapping IPs can be a red flag for fraudulent behavior. Applies ${MAX_IP_CONSISTENCY_PUNISHMENT} points if IP addresses overlap with other users.`,
  overlappingFingerprints: `Detects if the user shares device fingerprints with other accounts. Shared fingerprints may indicate potential fraud. Applies ${MAX_FINGERPRINT_CONSISTENCY_PUNISHMENT} points if device fingerprints overlap with other users.`,
  turnstileTrust: `Tracks the success rate of bot verifications over time. More successful verifications indicate a human user. Awards +${MAX_TURNSTILE_TRUST_BONUS} to ${MIN_TURNSTILE_TRUST_PENALTY} points based on risk score from most recent verification.`
};

// Specific quality schemas for each user source type with discriminator
export const signupUserQualitySchema = z.object({
  type: z.literal('SIGNUP'),
  id: z.string(),
  userId: z.string(),
  score: z.number(),
  metrics: userScoreMetricsSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export const anonymousUserQualitySchema = z.object({
  type: z.literal('ANONYMOUS'),
  id: z.string(),
  userId: z.string(),
  score: z.number(),
  metrics: userScoreMetricsSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export const twitterUserQualitySchema = z.object({
  type: z.literal('TWITTER_IMPORT'),
  id: z.string(),
  userId: z.string(),
  score: z.number(),
  metrics: twitterScoreMetricsSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export const blueskyUserQualitySchema = z.object({
  type: z.literal('BLUESKY_IMPORT'),
  id: z.string(),
  userId: z.string(),
  score: z.number(),
  metrics: blueskyScoreMetricsSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export const manualImportUserQualitySchema = z.object({
  type: z.literal('MANUAL_IMPORT'),
  id: z.string(),
  userId: z.string(),
  score: z.number(),
  metrics: userScoreMetricsSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export const discordImportUserQualitySchema = z.object({
  type: z.literal('DISCORD_IMPORT'),
  id: z.string(),
  userId: z.string(),
  score: z.number(),
  metrics: discordScoreMetricsSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

// Discriminated union schema - enables proper type narrowing based on 'type' field
export const userQualitySchema = z.discriminatedUnion('type', [
  signupUserQualitySchema,
  anonymousUserQualitySchema,
  twitterUserQualitySchema,
  blueskyUserQualitySchema,
  manualImportUserQualitySchema,
  discordImportUserQualitySchema
]);

export type UserQualitySchema = z.infer<typeof userQualitySchema>;
export type SignupUserQualitySchema = z.infer<typeof signupUserQualitySchema>;
export type AnonymousUserQualitySchema = z.infer<
  typeof anonymousUserQualitySchema
>;
export type TwitterUserQualitySchema = z.infer<typeof twitterUserQualitySchema>;
export type BlueskyUserQualitySchema = z.infer<typeof blueskyUserQualitySchema>;
export type ManualImportUserQualitySchema = z.infer<
  typeof manualImportUserQualitySchema
>;
export type DiscordImportUserQualitySchema = z.infer<
  typeof discordImportUserQualitySchema
>;

export const DEFAULT_USER_SCORE_METRICS: UserScoreMetricsSchema = {
  baseScore: USER_BASE_SCORE,
  deviceStability: 0,
  ipConsistency: 0,
  geoConsistency: 0,
  providersConnected: 0,
  emailVerified: 0,
  taskActivity: 0,
  taskDiversity: 0,
  accountAge: 0,
  overlappingIpAddresses: 0,
  overlappingFingerprints: 0,
  turnstileTrust: 0
};

// Fallback metrics for Twitter imports with base score
export const DEFAULT_TWITTER_SCORE_METRICS: TwitterScoreMetrics = {
  baseScore: USER_BASE_SCORE,
  profileImage: 0,
  profileBanner: 0,
  locationSet: 0,
  usernameQuality: 0,
  description: 0,
  followers: 0,
  following: 0,
  tweets: 0,
  giveawaysEntered: 0,
  accountAge: 0,
  verified: 0,
  bannedAccount: 0
};

// Fallback metrics for Bluesky imports with base score
export const DEFAULT_BLUESKY_SCORE_METRICS: BlueskyScoreMetrics = {
  baseScore: USER_BASE_SCORE,
  profileAvatar: 0,
  profileBanner: 0,
  handleQuality: 0,
  description: 0,
  followers: 0,
  following: 0,
  posts: 0,
  giveawaysEntered: 0,
  accountAge: 0,
  bannedAccount: 0
};

// Fallback metrics for Discord imports with base score
export const DEFAULT_DISCORD_SCORE_METRICS: DiscordScoreMetrics = {
  baseScore: USER_BASE_SCORE,
  profileAvatar: 0,
  profileBanner: 0,
  serverTenure: 0,
  nitroBooster: 0,
  unusualDmActivity: 0,
  communicationDisabled: 0
};

// Helper functions to convert platform-specific metrics
const toTwitterImportQuality = (
  data: Prisma.UserQualityGetPayload<{
    include: { user: { select: { source: true } } };
  }>
): TwitterUserQualitySchema => {
  const twitterMetrics = twitterScoreMetricsSchema.safeParse(data.metrics);

  if (!twitterMetrics.success) {
    console.error(
      'Invalid Twitter metrics for TWITTER_IMPORT user:',
      twitterMetrics.error
    );
    console.error('Metrics data:', data.metrics);
  }

  return {
    type: 'TWITTER_IMPORT' as const,
    id: data.id,
    userId: data.userId,
    score: clamp(data.score, 0, 100),
    metrics: twitterMetrics.success
      ? twitterMetrics.data
      : DEFAULT_TWITTER_SCORE_METRICS,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
};

const toBlueskyImportQuality = (
  data: Prisma.UserQualityGetPayload<{
    include: { user: { select: { source: true } } };
  }>
): BlueskyUserQualitySchema => {
  const blueskyMetrics = blueskyScoreMetricsSchema.safeParse(data.metrics);

  if (!blueskyMetrics.success) {
    console.error(
      'Invalid Bluesky metrics for BLUESKY_IMPORT user:',
      blueskyMetrics.error
    );
    console.error('Metrics data:', data.metrics);
  }

  return {
    type: 'BLUESKY_IMPORT' as const,
    id: data.id,
    userId: data.userId,
    score: clamp(data.score, 0, 100),
    metrics: blueskyMetrics.success
      ? blueskyMetrics.data
      : DEFAULT_BLUESKY_SCORE_METRICS,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
};

const toSignupUserQuality = (
  data: Prisma.UserQualityGetPayload<{
    include: { user: { select: { source: true } } };
  }>,
  type: 'SIGNUP' | 'ANONYMOUS' | 'MANUAL_IMPORT'
):
  | SignupUserQualitySchema
  | AnonymousUserQualitySchema
  | ManualImportUserQualitySchema => {
  const userMetrics = userScoreMetricsSchema.partial().safeParse(data.metrics);

  if (!userMetrics.success) {
    console.error('Invalid user quality metrics:', userMetrics.error);
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid user quality metrics',
      cause: userMetrics.error
    });
  }

  const baseData = {
    id: data.id,
    userId: data.userId,
    score: clamp(data.score, 0, 100),
    metrics: { ...DEFAULT_USER_SCORE_METRICS, ...userMetrics.data },
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };

  return { ...baseData, type };
};

const toDiscordImportQuality = (
  data: Prisma.UserQualityGetPayload<{
    include: { user: { select: { source: true } } };
  }>
): DiscordImportUserQualitySchema => {
  const discordMetrics = discordScoreMetricsSchema.safeParse(data.metrics);

  if (!discordMetrics.success) {
    console.error(
      'Invalid Discord metrics for DISCORD_IMPORT user:',
      discordMetrics.error
    );
    console.error('Metrics data:', data.metrics);
  }

  return {
    type: 'DISCORD_IMPORT' as const,
    id: data.id,
    userId: data.userId,
    score: clamp(data.score, 0, 100),
    metrics: discordMetrics.success
      ? discordMetrics.data
      : DEFAULT_DISCORD_SCORE_METRICS,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
};

export const toUserQuality = (
  data: Prisma.UserQualityGetPayload<{
    include: { user: { select: { source: true } } };
  }>
): UserQualitySchema => {
  const userSource = data.user.source;

  switch (userSource) {
    case 'TWITTER_IMPORT':
      return toTwitterImportQuality(data);
    case 'BLUESKY_IMPORT':
      return toBlueskyImportQuality(data);
    case 'SIGNUP':
      return toSignupUserQuality(data, 'SIGNUP');
    case 'ANONYMOUS':
      return toSignupUserQuality(data, 'ANONYMOUS');
    case 'MANUAL_IMPORT':
      return toSignupUserQuality(data, 'MANUAL_IMPORT');
    case 'DISCORD_IMPORT':
      return toDiscordImportQuality(data);
    default:
      throw assertNever(userSource);
  }
};
