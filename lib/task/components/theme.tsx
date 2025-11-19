import { EarthIcon, LucideIcon, StarIcon } from 'lucide-react';
import { assertNever } from '@/lib/errors';
import { TaskType } from '@prisma/client';
import React from 'react';
import { SocialDiscordIcon } from '@/lib/integrations/components/icons/discord-icon';
import { SocialSteamIcon } from '@/lib/integrations/components/icons/steam-icon';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { SocialTwitchIcon } from '@/lib/integrations/components/icons/twitch-icon';
import { SocialKickIcon } from '@/lib/integrations/components/icons/kick-icon';

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
          'bg-red-500 text-red-100 group-hover:bg-red-500  hover:bg-red-500',
        symbol: 'bg-red-500 text-red-100',
        arrow: 'bg-red-500 text-red-100 fill-red-500',
        icon: StarIcon
      };
    case 'VISIT_URL':
      return {
        action:
          'bg-blue-500 text-blue-100 group-hover:bg-blue-500 hover:bg-blue-500',
        symbol: 'bg-blue-500 text-blue-100',
        arrow: 'bg-blue-500 text-blue-100 fill-blue-500',
        icon: EarthIcon
      };
    case 'TWITTER_FOLLOW':
    case 'TWITTER_RETWEET':
    case 'TWITTER_CONNECT':
      return {
        action: 'bg-black text-white group-hover:bg-black hover:bg-black',
        symbol: 'bg-black text-white',
        arrow: 'bg-black text-white fill-black',
        icon: SocialXIcon
      };
    case 'STEAM_WISHLIST':
      return {
        action: 'bg-steam-1 text-white group-hover:bg-steam-1 hover:bg-steam-1',
        symbol: 'bg-white',
        arrow: 'bg-steam-1 text-steam-5 fill-steam-1',
        icon: SocialSteamIcon
      };
    case 'DISCORD_JOIN':
      return {
        action:
          'bg-discord-1 text-white group-hover:bg-discord-1 hover:bg-discord-1',
        symbol: 'bg-discord-1 text-white',
        arrow: 'bg-discord-1 text-white fill-discord-1',
        icon: SocialDiscordIcon
      };
    case 'TWITCH_FOLLOW':
      return {
        action:
          'bg-twitch-1 text-white group-hover:bg-twitch-1 hover:bg-twitch-1',
        symbol: 'bg-twitch-1 text-white',
        arrow: 'bg-twitch-1 text-white fill-twitch-1',
        icon: SocialTwitchIcon
      };
    case 'KICK_FOLLOW':
      return {
        action: 'text-white bg-black group-hover:bg-black/80 hover:bg-black/80',
        symbol: 'bg-black text-kick-1',
        arrow: 'bg-black text-white fill-black',
        icon: SocialKickIcon
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
