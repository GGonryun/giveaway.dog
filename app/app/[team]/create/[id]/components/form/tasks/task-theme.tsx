import { EarthIcon, LucideIcon, StarIcon } from 'lucide-react';
import { TaskType } from '@/schemas/giveaway';
import { assertNever } from '@/lib/errors';

export const toTheme = (
  type: TaskType
): { symbol: string; icon: LucideIcon; label: string } => {
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
