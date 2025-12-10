import { SweepstakesTabSchema } from '@/schemas/sweepstakes';
import { UserDetailsTabSchema } from '@/schemas/user';
import { IdentityProvider } from '@prisma/client';
export const MAX_USER_TEAMS = 5;
export const NEW_SWEEPSTAKE_THRESHOLD = 3;
export const ENDING_SOON_SWEEPSTAKE_THRESHOLD = 3;
export const STARTING_SOON_SWEEPSTAKE_THRESHOLD = 1;
export const UNKNOWN_USER_COUNTRY_CODE = 'XX';
export const UNKNOWN_USER_AGENT = 'unknown';
export const UNKNOWN_OS = 'Unknown OS';
export const UNKNOWN_BROWSER = 'Unknown Browser';
export const UNKNOWN_ACCEPTED_LANGUAGE = 'en';
export const UNKNOWN_IP = '::1';
export const UNKNOWN_TIMEZONE = 'UTC';
export const UNKNOWN_SCREEN = '0x0';
export const DEFAULT_TIME_SERIES_DURATION = 7;
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_SWEEPSTAKE_DURATION_DAYS = 30;
export const MAX_PICKER_SCHEDULE_DAYS = 7;
export const DEFAULT_SWEEPSTAKES_DETAILS_TAB: SweepstakesTabSchema = 'preview';
export const DEFAULT_USER_DETAILS_TAB: UserDetailsTabSchema = 'overview';
export const DEFAULT_ALLOWED_IDENTITIES = [
  IdentityProvider.TWITTER,
  IdentityProvider.GOOGLE,
  IdentityProvider.DISCORD,
  IdentityProvider.EMAIL,
  IdentityProvider.TWITCH,
  IdentityProvider.KICK,
  IdentityProvider.TIKTOK,
  IdentityProvider.STEAM
];
export const UNKNOWN_USER_NAME = 'Anonymous';
export const VISIT_URL = 'https://charity.games';
export const DISCORD_INVITE_LINK = 'https://discord.gg/Ys8wW5w2Yt';
export const DISCORD_PUBLIC_CHANNEL_URL =
  'https://discord.com/channels/1425715950988034130/1425715951906590732';
export const TWITTER_PROFILE_URL = 'https://x.com/TheGiveawayDog';
export const TWITTER_POST_URL =
  'https://x.com/TheGiveawayDog/status/1948654500698619966';
export const STEAM_APP_ID_URL =
  'https://store.steampowered.com/app/2457870/Sandys_Great_Escape/';
export const TWITCH_CHANNEL_URL = 'https://www.twitch.tv/ggonryun';
export const KICK_CHANNEL_URL = 'https://www.kick.com/ggonryun';
export const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@gonryun';
export const YOUTUBE_CHANNEL_NAME = 'GiveawayDog';
export const YOUTUBE_CHANNEL_ID = 'UCbTcSd0aoM0A0sxxz8TBD6w';
export const INSTAGRAM_PROFILE_URL =
  'https://www.instagram.com/charitydotgames/';
export const FACEBOOK_POST_URL =
  'https://www.facebook.com/permalink.php?story_fbid=122099278905154876&id=61584646297782&ref=embed_post';
