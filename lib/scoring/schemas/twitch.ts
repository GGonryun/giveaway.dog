import { widetype } from '@/lib/widetype';
import { LucideIcon, StarIcon } from 'lucide-react';
import z from 'zod';
import { PLATFORM_BASE_SCORE } from './shared';

export const twitchScoreMetricsSchema = z.object({
  baseScore: z.number()
});

export type TwitchScoreMetrics = z.infer<typeof twitchScoreMetricsSchema>;
export type TwitchMetricKey = keyof TwitchScoreMetrics;

export const TWITCH_METRIC_MAX: Record<TwitchMetricKey, number> = {
  baseScore: PLATFORM_BASE_SCORE
};

export const TWITCH_METRIC_LABELS: Record<TwitchMetricKey, string> = {
  baseScore: 'Base Score'
};

export const TWITCH_METRIC_ICONS: Record<TwitchMetricKey, LucideIcon> = {
  baseScore: StarIcon
};

export const TWITCH_METRIC_DESCRIPTION: Record<TwitchMetricKey, string> = {
  baseScore: `The foundational score assigned to all users. Twitch-imported users receive the base score of +${PLATFORM_BASE_SCORE} points as authenticity cannot be verified.`
};

export const TWITCH_METRIC_TYPE: Record<
  TwitchMetricKey,
  'quality' | 'risk' | 'bonus'
> = {
  baseScore: 'bonus'
};

export const TWITCH_QUALITY_METRICS: TwitchMetricKey[] = widetype
  .keys(TWITCH_METRIC_TYPE)
  .filter((key) => TWITCH_METRIC_TYPE[key] === 'quality');

export const TWITCH_RISK_METRICS: TwitchMetricKey[] = widetype
  .keys(TWITCH_METRIC_TYPE)
  .filter((key) => TWITCH_METRIC_TYPE[key] === 'risk');

export const TWITCH_BONUS_METRICS: TwitchMetricKey[] = widetype
  .keys(TWITCH_METRIC_TYPE)
  .filter((key) => TWITCH_METRIC_TYPE[key] === 'bonus');

export const TWITCH_METRIC_KEYS: TwitchMetricKey[] = widetype.keys(
  TWITCH_METRIC_LABELS
);
