import { EarthIcon, LucideIcon, StarIcon, TwitterIcon } from 'lucide-react';
import { assertNever } from '@/lib/errors';
import { TaskType } from '@prisma/client';
import React from 'react';
import { SocialXIcon } from '../ui/patterns/x-icon';

export type TaskTheme = {
  action: string;
  symbol: string;
  arrow: string;
  icon: LucideIcon;
};

const SHARED_TWITTER_STYLES = {};

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
  return context.theme;
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
