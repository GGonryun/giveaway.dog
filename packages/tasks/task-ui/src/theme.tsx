import {
  ClockIcon,
  EarthIcon,
  HeartIcon,
  KeyRound,
  LucideIcon,
  StarIcon,
  UsersIcon,
  MessageSquareIcon,
  UserCheck,
  UploadCloud
} from 'lucide-react';
import { assertNever } from '@giveaway/util-errors';

import React from 'react';
import { SocialDiscordIcon } from '@giveaway/integration-icons/discord-icon';
import { SocialSteamIcon } from '@giveaway/integration-icons/steam-icon';
import { SocialXIcon } from '@giveaway/integration-icons/x-icon';
import { SocialTwitchIcon } from '@giveaway/integration-icons/twitch-icon';
import { SocialKickIcon } from '@giveaway/integration-icons/kick-icon';
import { SocialYouTubeIcon } from '@giveaway/integration-icons/youtube';
import { SocialInstagramIcon } from '@giveaway/integration-icons/instagram';
import { SocialFacebookIcon } from '@giveaway/integration-icons/facebook-icon';
import { SocialTikTokIcon } from '@giveaway/integration-icons/tiktok-icon';
import { SocialBlueskyIcon } from '@giveaway/integration-icons/bluesky-icon';
import { SocialVeloraIcon } from '@giveaway/integration-icons/velora-icon';
import { SocialLinkedInIcon } from '@giveaway/integration-icons/linked-in-icon';
import { TaskType } from '@giveaway/task-model/schemas';

export type TaskTheme = {
  action: string;
  symbol: string;
  arrow: string;
  icon: LucideIcon;
};

export const toTaskTheme = (type: TaskType): TaskTheme => {
  switch (type) {
    case 'BONUS_TASK':
      return {
        action:
          'bg-red-600 text-white group-hover:bg-red-600 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-600',
        symbol: 'bg-red-600 text-white',
        arrow: 'bg-red-600 text-white fill-red-600',
        icon: StarIcon
      };
    case 'BONUS_TIMED':
      return {
        action:
          'bg-yellow-700 text-white group-hover:bg-yellow-700 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-700',
        symbol: 'bg-yellow-700 text-white',
        arrow: 'bg-yellow-700 text-white fill-yellow-700',
        icon: ClockIcon
      };
    case 'BONUS_LIMITED':
      return {
        action:
          'bg-purple-600 text-white group-hover:bg-purple-600 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-600',
        symbol: 'bg-purple-600 text-white',
        arrow: 'bg-purple-600 text-white fill-purple-600',
        icon: UsersIcon
      };
    case 'BONUS_LOYALTY':
      return {
        action:
          'bg-indigo-600 text-white group-hover:bg-indigo-600 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-600',
        symbol: 'bg-indigo-600 text-white',
        arrow: 'bg-indigo-600 text-white fill-indigo-600',
        icon: HeartIcon
      };
    case 'BONUS_COMPLETE_PROFILE':
      return {
        action:
          'bg-emerald-700 text-white group-hover:bg-emerald-700 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-700',
        symbol: 'bg-emerald-700 text-white',
        arrow: 'bg-emerald-700 text-white fill-emerald-700',
        icon: UserCheck
      };
    case 'VISIT_URL':
      return {
        action:
          'bg-blue-600 text-white group-hover:bg-blue-600 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-600',
        symbol: 'bg-blue-600 text-white',
        arrow: 'bg-blue-600 text-white fill-blue-600',
        icon: EarthIcon
      };
    case 'SECRET_CODE':
    case 'SECRET_CODE_V2':
      return {
        action:
          'bg-green-700 text-white group-hover:bg-green-700 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-700',
        symbol: 'bg-green-700 text-white',
        arrow: 'bg-green-700 text-white fill-green-700',
        icon: KeyRound
      };
    case 'TWITTER_CONNECT':
    case 'TWITTER_FOLLOW':
    case 'TWITTER_RETWEET':
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_RETWEET_IMPORT_V2':
    case 'TWITTER_LIKE':
    case 'TWITTER_LIKE_IMPORT':
      return {
        action:
          'bg-black text-white group-hover:bg-black hover:bg-black dark:bg-black dark:hover:bg-black',
        symbol: 'bg-black text-white',
        arrow: 'bg-black text-white fill-black',
        icon: SocialXIcon
      };
    case 'STEAM_WISHLIST':
    case 'STEAM_FOLLOW':
      return {
        action:
          'bg-steam-1 text-white group-hover:bg-steam-1 hover:bg-steam-1 dark:bg-steam-1 dark:hover:bg-steam-1',
        symbol: 'bg-white text-steam-1',
        arrow: 'bg-steam-1 text-steam-5 fill-steam-1',
        icon: SocialSteamIcon
      };
    case 'DISCORD_JOIN':
    case 'DISCORD_INTERACTION_IMPORT':
      return {
        action:
          'bg-discord-contrast text-white group-hover:bg-discord-contrast hover:bg-discord-contrast dark:bg-discord-contrast dark:hover:bg-discord-contrast',
        symbol: 'bg-discord-1 text-white',
        arrow: 'bg-discord-contrast text-white fill-discord-contrast',
        icon: SocialDiscordIcon
      };
    case 'TWITCH_FOLLOW':
    case 'TWITCH_CHAT_IMPORT':
      return {
        action:
          'bg-twitch-1 text-white group-hover:bg-twitch-1 hover:bg-twitch-1 dark:bg-twitch-1 dark:hover:bg-twitch-1',
        symbol: 'bg-twitch-1 text-white',
        arrow: 'bg-twitch-1 text-white fill-twitch-1',
        icon: SocialTwitchIcon
      };
    case 'KICK_FOLLOW':
      return {
        action:
          'text-white bg-black group-hover:bg-black/80 hover:bg-black/80 dark:bg-black dark:hover:bg-black',
        symbol: 'bg-black text-kick-1',
        arrow: 'bg-black text-white fill-black',
        icon: SocialKickIcon
      };
    case 'YOUTUBE_VISIT':
      return {
        action:
          'text-white bg-youtube-contrast group-hover:bg-youtube-contrast/80 hover:bg-youtube-contrast/80 dark:bg-youtube-contrast dark:hover:bg-youtube-contrast',
        symbol: 'bg-youtube-1 text-white',
        arrow: 'bg-youtube-contrast text-white fill-youtube-contrast',
        icon: SocialYouTubeIcon
      };
    case 'INSTAGRAM_VISIT':
    case 'INSTAGRAM_LIKE':
    case 'INSTAGRAM_COMMENT':
      return {
        action:
          'text-white bg-instagram-contrast group-hover:bg-instagram-contrast/80 hover:bg-instagram-contrast/80 dark:bg-instagram-contrast/80 dark:hover:bg-instagram-contrast/80',
        symbol: 'bg-instagram-1 text-white',
        arrow: 'bg-instagram-contrast text-white fill-instagram-contrast',
        icon: SocialInstagramIcon
      };
    case 'FACEBOOK_VISIT_PAGE':
    case 'FACEBOOK_VIEW_POST':
      return {
        action:
          'text-white bg-facebook-1 group-hover:bg-facebook-1/80 hover:bg-facebook-1/80 dark:bg-facebook-1 dark:hover:bg-facebook-1',
        symbol: 'bg-facebook-1 text-white',
        arrow: 'bg-facebook-1 text-white fill-facebook-1',
        icon: SocialFacebookIcon
      };
    case 'TIKTOK_FOLLOW':
    case 'TIKTOK_LIKE':
      return {
        action: 'text-white bg-black group-hover:opacity-80 hover:opacity-80',
        symbol: 'bg-black text-white',
        arrow: 'bg-black text-white fill-black',
        icon: SocialTikTokIcon
      };
    case 'BLUESKY_CONNECT':
    case 'BLUESKY_FOLLOW':
    case 'BLUESKY_LIKE':
    case 'BLUESKY_REPOST':
    case 'BLUESKY_LIKE_IMPORT':
    case 'BLUESKY_REPOST_IMPORT':
      return {
        action:
          'bg-bluesky-contrast text-white group-hover:bg-bluesky-contrast group-hover:text-white hover:bg-bluesky-contrast  hover:text-white dark:bg-bluesky-contrast dark:hover:text-white dark:hover:bg-bluesky-contrast',
        symbol: 'bg-white text-bluesky-1',
        arrow: 'bg-bluesky-contrast text-white fill-bluesky-contrast',
        icon: SocialBlueskyIcon
      };
    case 'VELORA_CONNECT':
    case 'VELORA_FOLLOW':
      return {
        action:
          'bg-velora-contrast text-white group-hover:bg-velora-contrast group-hover:text-white hover:bg-velora-contrast hover:text-white dark:bg-velora-contrast dark:hover:text-white dark:hover:bg-velora-contrast',
        symbol: 'bg-white text-velora-1',
        arrow: 'bg-velora-contrast text-white fill-velora-contrast',
        icon: SocialVeloraIcon
      };
    case 'LINKEDIN_CONNECT':
    case 'LINKEDIN_FOLLOW':
      return {
        action:
          'bg-linkedin-1 text-white group-hover:bg-linkedin-1 group-hover:text-white hover:bg-linkedin-1 hover:text-white dark:bg-linkedin-1 dark:hover:text-white dark:hover:bg-linkedin-1',
        symbol: 'bg-white text-linkedin-1',
        arrow: 'bg-linkedin-1 text-white fill-linkedin-1',
        icon: SocialLinkedInIcon
      };
    case 'ASK_QUESTION':
    case 'SINGLE_CHOICE':
    case 'MULTIPLE_CHOICE':
      return {
        action:
          'text-primary-foreground bg-primary group-hover:bg-primary/80 hover:bg-primary/80 dark:bg-primary dark:hover:bg-primary/80',
        symbol: 'bg-primary text-white',
        arrow: 'bg-primary text-primary-foreground fill-primary',
        icon: MessageSquareIcon
      };
    case 'SUBMIT_MEDIA':
      return {
        action:
          'text-primary-foreground bg-primary group-hover:bg-primary/80 hover:bg-primary/80 dark:bg-primary dark:hover:bg-primary/80',
        symbol: 'bg-primary text-white',
        arrow: 'bg-primary text-primary-foreground fill-primary',
        icon: UploadCloud
      };
    case 'REFERRAL_LINK':
      return {
        action:
          'bg-amber-700 text-white group-hover:bg-amber-700 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-700',
        symbol: 'bg-amber-700 text-white',
        arrow: 'bg-amber-700 text-white fill-amber-700',
        icon: UsersIcon
      };
    default:
      throw assertNever(type);
  }
};

const TaskThemeContext = React.createContext<{
  theme: TaskTheme;
} | null>(null);

export const useTaskTheme = () => {
  const context = React.useContext(TaskThemeContext);
  if (!context) {
    throw new Error('useTaskTheme must be used within a TaskThemeProvider');
  }
  return context;
};

export const TaskThemeProvider: React.FC<{
  type: TaskType;

  children: React.ReactNode;
}> = ({ type, children }) => {
  const theme = toTaskTheme(type);
  return (
    <TaskThemeContext.Provider value={{ theme }}>
      {children}
    </TaskThemeContext.Provider>
  );
};
