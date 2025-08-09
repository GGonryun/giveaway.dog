import { EarthIcon, LucideIcon, StarIcon } from 'lucide-react';
import { assertNever } from '@/lib/errors';
import { TaskType } from '@/schemas/giveaway';

export interface TaskTheme {
  symbol: string;
  icon: LucideIcon;
  label: string;
}

export const getTaskTheme = (type: TaskType): TaskTheme => {
  switch (type) {
    case 'bonus-task':
      return {
        symbol: 'bg-yellow-100 text-yellow-800',
        icon: StarIcon,
        label: 'Bonus Task'
      };
    case 'visit-url':
      return {
        symbol: 'bg-blue-100 text-blue-800',
        icon: EarthIcon,
        label: 'Visit URL'
      };
    default:
      throw assertNever(type);
  }
};

// Legacy alias for backward compatibility
export const toTheme = getTaskTheme;
