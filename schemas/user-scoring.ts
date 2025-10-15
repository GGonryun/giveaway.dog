import { ApplicationError } from '@/lib/errors';
import { widetype } from '@/lib/widetype';
import { Prisma } from '@prisma/client';
import {
  CloudAlert,
  CloudCheck,
  Activity,
  Cable,
  Clock,
  Cloud,
  EarthLock,
  FileStack,
  LucideIcon,
  Mail,
  MonitorSmartphone,
  MonitorX
} from 'lucide-react';
import z from 'zod';

export const MAX_SCORING_REQUESTS_PER_RUN = 10;
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

export const userScoreMetricsSchema = z.object({
  deviceStability: z.number(),
  ipConsistency: z.number(),
  geoConsistency: z.number(),
  providersConnected: z.number(),
  emailVerified: z.number(),
  taskActivity: z.number(),
  taskDiversity: z.number(),
  accountAge: z.number(),
  overlappingIpAddresses: z.number(),
  overlappingFingerprints: z.number()
});

export type UserScoreMetricsSchema = z.infer<typeof userScoreMetricsSchema>;
export type UserScoreMetricKey = keyof UserScoreMetricsSchema;

export const USER_METRIC_TYPE: Record<UserScoreMetricKey, 'quality' | 'risk'> =
  {
    deviceStability: 'quality',
    ipConsistency: 'quality',
    geoConsistency: 'quality',
    providersConnected: 'quality',
    emailVerified: 'quality',
    taskActivity: 'quality',
    taskDiversity: 'quality',
    accountAge: 'quality',
    overlappingIpAddresses: 'risk',
    overlappingFingerprints: 'risk'
  };

export const USER_QUALITY_METRICS: UserScoreMetricKey[] = widetype
  .keys(USER_METRIC_TYPE)
  .filter((key) => USER_METRIC_TYPE[key] === 'quality');

export const USER_RISK_METRICS: UserScoreMetricKey[] = widetype
  .keys(USER_METRIC_TYPE)
  .filter((key) => USER_METRIC_TYPE[key] === 'risk');

export const USER_METRIC_LABELS: Record<UserScoreMetricKey, string> = {
  deviceStability: 'Device Stability',
  ipConsistency: 'IP Consistency',
  geoConsistency: 'Geolocation Consistency',
  providersConnected: 'Providers Connected',
  emailVerified: 'Email Verified',
  taskActivity: 'Task Activity',
  taskDiversity: 'Task Diversity',
  accountAge: 'Account Age',
  overlappingIpAddresses: 'Overlapping IPs',
  overlappingFingerprints: 'Overlapping Device Fingerprints'
};

export const USER_METRIC_ICONS: Record<UserScoreMetricKey, LucideIcon> = {
  deviceStability: MonitorSmartphone,
  ipConsistency: CloudCheck,
  geoConsistency: EarthLock,
  providersConnected: Cable,
  emailVerified: Mail,
  taskActivity: Activity,
  taskDiversity: FileStack,
  accountAge: Clock,
  overlappingIpAddresses: CloudAlert,
  overlappingFingerprints: MonitorX
};

export const USER_METRIC_MAX: Record<UserScoreMetricKey, number> = {
  deviceStability: MAX_DEVICE_STABILITY_BONUS,
  ipConsistency: MAX_IP_CONSISTENCY_BONUS,
  geoConsistency: MAX_GEO_CONSISTENCY_BONUS,
  providersConnected: MAX_PROVIDERS_CONNECTED_BONUS,
  emailVerified: MAX_EMAIL_VERIFIED_BONUS,
  taskActivity: MAX_TASK_ACTIVITY_BONUS,
  taskDiversity: MAX_TASK_DIVERSITY_BONUS,
  accountAge: MAX_ACCOUNT_AGE_BONUS,
  overlappingIpAddresses: MAX_IP_CONSISTENCY_PUNISHMENT,
  overlappingFingerprints: MAX_FINGERPRINT_CONSISTENCY_PUNISHMENT
};

export const USER_METRIC_DESCRIPTION: Record<UserScoreMetricKey, string> = {
  deviceStability:
    'Measures how consistently the user accesses the platform from the same devices over time. Higher stability indicates a more trustworthy user.',
  ipConsistency:
    'Assesses the consistency of IP addresses used by the user. Frequent changes in IP addresses may indicate suspicious activity.',
  geoConsistency:
    'Evaluates the geographical locations from which the user accesses the platform. Consistent locations suggest a more reliable user.',
  providersConnected:
    'Counts the number of unique service providers (e.g., email, social media) linked to the user account. More connections can enhance trustworthiness.',
  emailVerified:
    'Indicates whether the user has verified their email address. A verified email adds credibility to the user profile.',
  taskActivity:
    'Tracks the number of tasks completed by the user in the last 30 days. Higher activity levels suggest an engaged and genuine user.',
  taskDiversity:
    'Measures the variety of different tasks completed by the user. A diverse task history indicates a more authentic user.',
  accountAge:
    'Calculates the age of the user account. Older accounts are generally more trustworthy than newly created ones.',
  overlappingIpAddresses:
    'Identifies if the user shares IP addresses with other accounts. Overlapping IPs can be a red flag for fraudulent behavior.',
  overlappingFingerprints:
    'Detects if the user shares device fingerprints with other accounts. Shared fingerprints may indicate potential fraud.'
};

export const userQualitySchema = z.object({
  id: z.string(),
  userId: z.string(),
  score: z.number(),
  metrics: userScoreMetricsSchema,
  createdAt: z.date(),
  updatedAt: z.date()
});

export type UserQualitySchema = z.infer<typeof userQualitySchema>;

export const toUserQuality = (
  data: Prisma.UserQualityGetPayload<{}>
): UserQualitySchema => {
  const metrics = userScoreMetricsSchema.safeParse(data.metrics);
  if (!metrics.success) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid user quality metrics',
      cause: metrics.error
    });
  }

  return {
    id: data.id,
    userId: data.userId,
    score: data.score,
    metrics: metrics.data,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
};
