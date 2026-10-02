import z from 'zod';

export const accountTabSchema = z.union([
  z.literal('profile'),
  z.literal('history'),
  z.literal('features'),
  z.literal('appearance'),
  z.literal('notifications'),
  z.literal('danger-zone')
]);

export type AccountTabSchema = z.infer<typeof accountTabSchema>;

export const DEFAULT_ACCOUNT_TAB: AccountTabSchema = 'profile';

export const ACCOUNT_TAB_OPTIONS: Record<AccountTabSchema, string> = {
  profile: 'Profile',
  history: 'History',
  features: 'Features',
  appearance: 'Appearance',
  notifications: 'Notifications',
  'danger-zone': 'Danger Zone'
};

export const isAccountTab = (tab: string): tab is AccountTabSchema => {
  return accountTabSchema.safeParse(tab).success;
};
