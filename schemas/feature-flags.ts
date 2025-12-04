import { UserFeatureFlag, TeamFeatureFlag } from '@prisma/client';
import { compact } from 'lodash';
import z from 'zod';

export const BASIC_DASHBOARD_FEATURE_FLAG_KEY = 'basic-user';
export const HOST_DASHBOARD_FEATURE_FLAG_KEY = 'host-dashboard';
export const PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY = 'public-sweepstakes';
export const PICKERS_FEATURE_FLAG_KEY = 'pickers';

export const userFeatureFlagKeySchema = z.union([
  z.literal(BASIC_DASHBOARD_FEATURE_FLAG_KEY),
  z.literal(HOST_DASHBOARD_FEATURE_FLAG_KEY)
]);

export const teamFeatureFlagKeySchema = z.union([
  z.literal(PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY),
  z.literal(PICKERS_FEATURE_FLAG_KEY)
]);

export type UserFeatureFlagKeySchema = z.infer<typeof userFeatureFlagKeySchema>;
export type TeamFeatureFlagKeySchema = z.infer<typeof teamFeatureFlagKeySchema>;

export const DEFAULT_USER_FEATURE_FLAGS: Record<
  UserFeatureFlagKeySchema,
  boolean
> = {
  [BASIC_DASHBOARD_FEATURE_FLAG_KEY]: true,
  [HOST_DASHBOARD_FEATURE_FLAG_KEY]: false
};

export const DEFAULT_TEAM_FEATURE_FLAGS: Record<
  TeamFeatureFlagKeySchema,
  boolean
> = {
  [PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY]: false,
  [PICKERS_FEATURE_FLAG_KEY]: false
};

export const USER_FEATURE_FLAG_LABELS: Record<
  UserFeatureFlagKeySchema,
  string
> = {
  [BASIC_DASHBOARD_FEATURE_FLAG_KEY]: 'Participate in Sweepstakes',
  [HOST_DASHBOARD_FEATURE_FLAG_KEY]: 'Host Sweepstakes'
};

export const TEAM_FEATURE_FLAG_LABELS: Record<
  TeamFeatureFlagKeySchema,
  string
> = {
  [PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY]: 'Public Sweepstakes',
  [PICKERS_FEATURE_FLAG_KEY]: 'Pickers'
};

export const USER_FEATURE_FLAG_DESCRIPTIONS: Record<
  UserFeatureFlagKeySchema,
  string
> = {
  [BASIC_DASHBOARD_FEATURE_FLAG_KEY]:
    'Join and enter sweepstakes hosted by others. Complete tasks to earn entries and increase your chances of winning prizes.',
  [HOST_DASHBOARD_FEATURE_FLAG_KEY]:
    'Create and manage your own sweepstakes. Set up tasks, manage participants, and select winners for your giveaways.'
};

export const TEAM_FEATURE_FLAG_DESCRIPTIONS: Record<
  TeamFeatureFlagKeySchema,
  string
> = {
  [PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY]:
    'Make team sweepstakes visible to everyone. Allow users to discover and join team giveaways without needing to share a link.',
  [PICKERS_FEATURE_FLAG_KEY]:
    'Enable picker tools for selecting winners from social media posts (Twitter/X likes, retweets, quotes, and replies).'
};

export const parseUserFlag = (flag: UserFeatureFlag) => {
  if (!flag) return null;
  const result = userFeatureFlagKeySchema.safeParse(flag.key);
  if (result.success) {
    return result.data;
  }
  return null;
};

export const parseUserFeatureFlags = (flags: UserFeatureFlag[]) => {
  if (!flags) return [];
  return compact(flags.map((flag) => parseUserFlag(flag)));
};

export const parseTeamFlag = (flag: TeamFeatureFlag) => {
  if (!flag) return null;
  const result = teamFeatureFlagKeySchema.safeParse(flag.key);
  if (result.success) {
    return result.data;
  }
  return null;
};

export const parseTeamFeatureFlags = (flags: TeamFeatureFlag[]) => {
  if (!flags) return [];
  return compact(flags.map((flag) => parseTeamFlag(flag)));
};
