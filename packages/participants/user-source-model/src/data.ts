import { UserSource } from '@giveaway/db-model';

export const USER_SOURCE_LABEL: Record<UserSource, string> = {
  SIGNUP: 'Verified Users',
  TWITTER_IMPORT: 'X Import',
  BLUESKY_IMPORT: 'Bluesky Import',
  MANUAL_IMPORT: 'Manual Import',
  DISCORD_IMPORT: 'Discord Import',
  TWITCH_IMPORT: 'Twitch Import',
  ANONYMOUS: 'Anonymous Users'
};
