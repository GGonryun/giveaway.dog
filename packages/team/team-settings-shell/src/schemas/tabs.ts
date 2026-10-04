import z from 'zod';

export const SETTINGS_TAB_OPTIONS = {
  profile: 'Profile',
  socials: 'Socials',
  team: 'Team',
  integrations: 'Integrations'
} as const;

export type SettingsTabSchema = keyof typeof SETTINGS_TAB_OPTIONS;

export const settingsTabSchema = z.enum([
  'profile',
  'socials',
  'team',
  'integrations'
]);

export const isSettingsTab = (value: string): value is SettingsTabSchema => {
  return settingsTabSchema.safeParse(value).success;
};

export const DEFAULT_SETTINGS_TAB: SettingsTabSchema = 'profile';

const tabRegex = new RegExp('^/app/[^/]+/settings(?:/([^/]+))?');

export const matchSettingsTab = (path: string): SettingsTabSchema | null => {
  const data = tabRegex.exec(path)?.[1];

  if (data && isSettingsTab(data)) {
    return data;
  }

  return null;
};
