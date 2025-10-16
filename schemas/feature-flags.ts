import { FeatureFlag } from '@prisma/client';
import { compact } from 'lodash';
import z from 'zod';

export const BASIC_DASHBOARD_FEATURE_FLAG_KEY = 'basic-user';
export const HOST_DASHBOARD_FEATURE_FLAG_KEY = 'host-dashboard';
export const PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY = 'public-sweepstakes';

export const featureFlagKeySchema = z.union([
  z.literal(BASIC_DASHBOARD_FEATURE_FLAG_KEY),
  z.literal(HOST_DASHBOARD_FEATURE_FLAG_KEY),
  z.literal(PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY)
]);

export type FeatureFlagKeySchema = z.infer<typeof featureFlagKeySchema>;

export const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagKeySchema, boolean> = {
  [BASIC_DASHBOARD_FEATURE_FLAG_KEY]: true,
  [HOST_DASHBOARD_FEATURE_FLAG_KEY]: false,
  [PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY]: false
};

export const FEATURE_FLAG_LABELS: Record<FeatureFlagKeySchema, string> = {
  [BASIC_DASHBOARD_FEATURE_FLAG_KEY]: 'Participate in Sweepstakes',
  [HOST_DASHBOARD_FEATURE_FLAG_KEY]: 'Host Sweepstakes',
  [PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY]: 'Public Sweepstakes'
};

export const FEATURE_FLAG_DESCRIPTIONS: Record<FeatureFlagKeySchema, string> = {
  [BASIC_DASHBOARD_FEATURE_FLAG_KEY]:
    'Join and enter sweepstakes hosted by others. Complete tasks to earn entries and increase your chances of winning prizes.',
  [HOST_DASHBOARD_FEATURE_FLAG_KEY]:
    'Create and manage your own sweepstakes. Set up tasks, manage participants, and select winners for your giveaways.',
  [PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY]:
    'Make your sweepstakes visible to everyone. Allow users to discover and join your giveaways without needing to share a link.'
};

export const parseFlag = (flag: FeatureFlag) => {
  if (!flag) return null;
  const result = featureFlagKeySchema.safeParse(flag.key);
  if (result.success) {
    return result.data;
  }
  return null;
};

export const parseFeatureFlags = (flags: FeatureFlag[]) => {
  if (!flags) return [];
  return compact(flags.map((flag) => parseFlag(flag)));
};
