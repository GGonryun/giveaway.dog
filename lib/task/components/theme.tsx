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
import { assertNever } from '@/lib/errors';
import { TaskType } from '@prisma/client';
import React from 'react';
import { SocialDiscordIcon } from '@/lib/integrations/components/icons/discord-icon';
import { SocialSteamIcon } from '@/lib/integrations/components/icons/steam-icon';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { SocialTwitchIcon } from '@/lib/integrations/components/icons/twitch-icon';
import { SocialKickIcon } from '@/lib/integrations/components/icons/kick-icon';
import { SocialYouTubeIcon } from '@/lib/integrations/components/icons/youtube';
import { SocialInstagramIcon } from '@/lib/integrations/components/icons/instagram';
import { SocialFacebookIcon } from '@/lib/integrations/components/icons/facebook-icon';
import { SocialTikTokIcon } from '@/lib/integrations/components/icons/tiktok-icon';
import { SocialBlueskyIcon } from '@/lib/integrations/components/icons/bluesky-icon';

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
          'bg-red-500 text-red-100 group-hover:bg-red-500 hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-500',
        symbol: 'bg-red-500 text-red-100',
        arrow: 'bg-red-500 text-red-100 fill-red-500',
        icon: StarIcon
      };
    case 'BONUS_TIMED':
      return {
        action:
          'bg-yellow-500 text-yellow-100 group-hover:bg-yellow-500 hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-500',
        symbol: 'bg-yellow-500 text-yellow-100',
        arrow: 'bg-yellow-500 text-yellow-100 fill-yellow-500',
        icon: ClockIcon
      };
    case 'BONUS_LIMITED':
      return {
        action:
          'bg-purple-500 text-purple-100 group-hover:bg-purple-500 hover:bg-purple-500 dark:bg-purple-500 dark:hover:bg-purple-500',
        symbol: 'bg-purple-500 text-purple-100',
        arrow: 'bg-purple-500 text-purple-100 fill-purple-500',
        icon: UsersIcon
      };
    case 'BONUS_LOYALTY':
      return {
        action:
          'bg-indigo-500 text-indigo-100 group-hover:bg-indigo-500 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-500',
        symbol: 'bg-indigo-500 text-indigo-100',
        arrow: 'bg-indigo-500 text-indigo-100 fill-indigo-500',
        icon: HeartIcon
      };
    case 'BONUS_COMPLETE_PROFILE':
      return {
        action:
          'bg-emerald-500 text-emerald-100 group-hover:bg-emerald-500 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-500',
        symbol: 'bg-emerald-500 text-emerald-100',
        arrow: 'bg-emerald-500 text-emerald-100 fill-emerald-500',
        icon: UserCheck
      };
    case 'VISIT_URL':
      return {
        action:
          'bg-blue-500 text-blue-100 group-hover:bg-blue-500 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-500',
        symbol: 'bg-blue-500 text-blue-100',
        arrow: 'bg-blue-500 text-blue-100 fill-blue-500',
        icon: EarthIcon
      };
    case 'SECRET_CODE':
      return {
        action:
          'bg-green-600 text-green-100 group-hover:bg-green-600 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-600',
        symbol: 'bg-green-600 text-green-100',
        arrow: 'bg-green-600 text-green-100 fill-green-600',
        icon: KeyRound
      };
    case 'TWITTER_CONNECT':
    case 'TWITTER_FOLLOW':
    case 'TWITTER_RETWEET':
    case 'TWITTER_RETWEET_IMPORT':
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
          'bg-discord-1 text-white group-hover:bg-discord-1 hover:bg-discord-1 dark:bg-discord-1 dark:hover:bg-discord-1',
        symbol: 'bg-discord-1 text-white',
        arrow: 'bg-discord-1 text-white fill-discord-1',
        icon: SocialDiscordIcon
      };
    case 'TWITCH_FOLLOW':
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
          'text-white bg-youtube-1 group-hover:bg-youtube-1/80 hover:bg-youtube-1/80 dark:bg-youtube-1 dark:hover:bg-youtube-1',
        symbol: 'bg-youtube-1 text-white',
        arrow: 'bg-youtube-1 text-white fill-youtube-1',
        icon: SocialYouTubeIcon
      };
    case 'INSTAGRAM_VISIT':
    case 'INSTAGRAM_LIKE':
    case 'INSTAGRAM_COMMENT':
      return {
        action:
          'text-white bg-instagram-1 group-hover:bg-instagram-1/80 hover:bg-instagram-1/80 dark:bg-instagram-1/80 dark:hover:bg-instagram-1/80',
        symbol: 'bg-instagram-1 text-white',
        arrow: 'bg-instagram-1 text-white fill-instagram-1',
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
          'bg-bluesky-1 text-white group-hover:bg-bluesky-1 group-hover:text-white hover:bg-bluesky-1  hover:text-white dark:bg-bluesky-1 dark:hover:text-white dark:hover:bg-bluesky-1',
        symbol: 'bg-white text-bluesky-1',
        arrow: 'bg-bluesky-1 text-white fill-bluesky-1',
        icon: SocialBlueskyIcon
      };
    case 'ASK_QUESTION':
    case 'SINGLE_CHOICE':
    case 'MULTIPLE_CHOICE':
      return {
        action:
          'text-white bg-primary group-hover:bg-primary/80 hover:bg-primary/80 dark:bg-primary dark:hover:bg-primary/80',
        symbol: 'bg-primary text-white',
        arrow: 'bg-primary text-white fill-primary',
        icon: MessageSquareIcon
      };
    case 'SUBMIT_MEDIA':
      return {
        action:
          'text-white bg-primary group-hover:bg-primary/80 hover:bg-primary/80 dark:bg-primary dark:hover:bg-primary/80',
        symbol: 'bg-primary text-white',
        arrow: 'bg-primary text-white fill-primary',
        icon: UploadCloud
      };
    case 'REFERRAL_LINK':
      return {
        action:
          'bg-amber-500 text-amber-100 group-hover:bg-amber-500 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-500',
        symbol: 'bg-amber-500 text-amber-100',
        arrow: 'bg-amber-500 text-amber-100 fill-amber-500',
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
