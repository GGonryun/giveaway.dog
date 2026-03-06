export const BASIC_DASHBOARD_FEATURE_FLAG_KEY = 'basic-user';
export const HOST_DASHBOARD_FEATURE_FLAG_KEY = 'host-dashboard';

export type UserFeatureFlagKeySchema =
  | typeof BASIC_DASHBOARD_FEATURE_FLAG_KEY
  | typeof HOST_DASHBOARD_FEATURE_FLAG_KEY;

export const DEFAULT_USER_FEATURE_FLAGS: Record<
  UserFeatureFlagKeySchema,
  boolean
> = {
  [BASIC_DASHBOARD_FEATURE_FLAG_KEY]: true,
  [HOST_DASHBOARD_FEATURE_FLAG_KEY]: false
};

export const USER_FEATURE_FLAG_LABELS: Record<
  UserFeatureFlagKeySchema,
  string
> = {
  [BASIC_DASHBOARD_FEATURE_FLAG_KEY]: 'Participate in Sweepstakes',
  [HOST_DASHBOARD_FEATURE_FLAG_KEY]: 'Host Sweepstakes'
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
