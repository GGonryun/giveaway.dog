import { widetype } from '@/lib/widetype';
import {
  Activity,
  Ban,
  Clock,
  ImageIcon,
  LayoutDashboard,
  LucideIcon,
  MessageSquareWarning,
  StarIcon
} from 'lucide-react';
import z from 'zod';

import { PLATFORM_BASE_SCORE } from './shared';

export const discordScoringDataSchema = z.object({
  userId: z.string(),
  username: z.string(),
  avatar: z.string().nullish(),
  banner: z.string().nullish(),
  joinedAt: z.string(),
  premiumSince: z.string().nullish(),
  communicationDisabledUntil: z.string().nullish(),
  unusualDmActivityUntil: z.string().nullish()
});

export type DiscordScoringData = z.infer<typeof discordScoringDataSchema>;

export const discordScoreMetricsSchema = z.object({
  baseScore: z.number(),
  profileAvatar: z.number(),
  profileBanner: z.number(),
  serverTenure: z.number(),
  nitroBooster: z.number(),
  unusualDmActivity: z.number(),
  communicationDisabled: z.number()
});

export type DiscordScoreMetrics = z.infer<typeof discordScoreMetricsSchema>;
export type DiscordMetricKey = keyof DiscordScoreMetrics;

export const DISCORD_PROFILE_AVATAR_BONUS = 5;
export const DISCORD_PROFILE_BANNER_BONUS = 5;
export const DISCORD_SERVER_TENURE_MAX = 60;
export const DISCORD_NITRO_BOOSTER_BONUS = 50;
export const DISCORD_UNUSUAL_DM_PENALTY = -50;
export const DISCORD_COMMUNICATION_DISABLED_PENALTY = -50;

export const DISCORD_METRIC_MAX: Record<DiscordMetricKey, number> = {
  baseScore: PLATFORM_BASE_SCORE,
  profileAvatar: DISCORD_PROFILE_AVATAR_BONUS,
  profileBanner: DISCORD_PROFILE_BANNER_BONUS,
  serverTenure: DISCORD_SERVER_TENURE_MAX,
  nitroBooster: DISCORD_NITRO_BOOSTER_BONUS,
  unusualDmActivity: 0,
  communicationDisabled: 0
};

export const DISCORD_METRIC_LABELS: Record<DiscordMetricKey, string> = {
  baseScore: 'Base Score',
  profileAvatar: 'Profile Avatar',
  profileBanner: 'Profile Banner',
  serverTenure: 'Server Tenure',
  nitroBooster: 'Nitro Booster',
  unusualDmActivity: 'DM Activity',
  communicationDisabled: 'Timeout Status'
};

export const DISCORD_METRIC_ICONS: Record<DiscordMetricKey, LucideIcon> = {
  baseScore: StarIcon,
  profileAvatar: ImageIcon,
  profileBanner: LayoutDashboard,
  serverTenure: Clock,
  nitroBooster: Activity,
  unusualDmActivity: MessageSquareWarning,
  communicationDisabled: Ban
};

export const DISCORD_METRIC_DESCRIPTION: Record<DiscordMetricKey, string> = {
  baseScore: `The foundational score assigned to all users, representing their initial trustworthiness on the platform. Fixed at +${PLATFORM_BASE_SCORE} points.`,
  profileAvatar: `Users with a profile avatar appear more legitimate and trustworthy. Complete profiles indicate genuine engagement on the platform. Awards +${DISCORD_PROFILE_AVATAR_BONUS} points when set.`,
  profileBanner: `Profile banners show account customization effort. Users who personalize their accounts are more likely to be authentic. Awards +${DISCORD_PROFILE_BANNER_BONUS} points when set.`,
  serverTenure: `How long the user has been a member of the server. Longer tenure indicates an established, trusted member. Awards +1 point per month of membership (max +${DISCORD_SERVER_TENURE_MAX} points).`,
  nitroBooster: `Users who boost the server with Nitro demonstrate investment in the community. Awards +${DISCORD_NITRO_BOOSTER_BONUS} points when actively boosting.`,
  unusualDmActivity: `Discord has flagged this account for unusual DM activity, which may indicate spam or bot behavior. Applies ${DISCORD_UNUSUAL_DM_PENALTY} points when flagged.`,
  communicationDisabled: `This user has been timed out by server moderators, indicating potential problematic behavior. Applies ${DISCORD_COMMUNICATION_DISABLED_PENALTY} points when active.`
};

export const DISCORD_METRIC_TYPE: Record<
  DiscordMetricKey,
  'quality' | 'risk' | 'bonus'
> = {
  baseScore: 'bonus',
  profileAvatar: 'quality',
  profileBanner: 'quality',
  serverTenure: 'quality',
  nitroBooster: 'quality',
  unusualDmActivity: 'risk',
  communicationDisabled: 'risk'
};

export const DISCORD_QUALITY_METRICS: DiscordMetricKey[] = widetype
  .keys(DISCORD_METRIC_TYPE)
  .filter((key) => DISCORD_METRIC_TYPE[key] === 'quality');

export const DISCORD_RISK_METRICS: DiscordMetricKey[] = widetype
  .keys(DISCORD_METRIC_TYPE)
  .filter((key) => DISCORD_METRIC_TYPE[key] === 'risk');

export const DISCORD_BONUS_METRICS: DiscordMetricKey[] = widetype
  .keys(DISCORD_METRIC_TYPE)
  .filter((key) => DISCORD_METRIC_TYPE[key] === 'bonus');

export const DISCORD_METRIC_KEYS: DiscordMetricKey[] = widetype.keys(
  DISCORD_METRIC_LABELS
);
