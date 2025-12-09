import { UserSource } from '@prisma/client';

export const USER_SOURCE_LABEL: Record<UserSource, string> = {
  SIGNUP: 'Verified Users',
  TWITTER_IMPORT: 'X Import',
  MANUAL_IMPORT: 'Manual Import',
  DISCORD_IMPORT: 'Discord Import',
  ANONYMOUS: 'Anonymous Users'
};

export const USER_SOURCE_DESCRIPTION: Record<UserSource, string> = {
  SIGNUP: 'Users who signed up directly through the giveaway platform.',
  TWITTER_IMPORT: 'Users imported from X (formerly Twitter).',
  MANUAL_IMPORT: 'Users added manually by the giveaway organizer.',
  DISCORD_IMPORT: 'Users imported from Discord.',
  ANONYMOUS: 'Anonymous users without verified identities.'
};

export const USER_SOURCE_MANAGEABLE: Record<UserSource, boolean> = {
  SIGNUP: false,
  TWITTER_IMPORT: true,
  MANUAL_IMPORT: true,
  DISCORD_IMPORT: true,
  ANONYMOUS: true
};

export const USER_SOURCE_COMING_SOON: Record<UserSource, boolean> = {
  SIGNUP: false,
  TWITTER_IMPORT: false,
  MANUAL_IMPORT: true,
  DISCORD_IMPORT: true,
  ANONYMOUS: true
};
