import { EarthIcon, LucideIcon, StarIcon } from 'lucide-react';
import { assertNever } from '@/lib/errors';
import { TaskType } from '@prisma/client';

export interface TaskTheme {
  symbol: string;
  icon: LucideIcon;
  label: string;
}

export const toTaskTheme = (
  type: TaskType
): { symbol: string; icon: LucideIcon; label: string } => {
  switch (type) {
    case 'BONUS_TASK':
      return {
        symbol: 'bg-red-500 text-red-100',
        icon: StarIcon,
        label: 'Bonus Task'
      };
    case 'VISIT_URL':
      return {
        symbol: 'bg-blue-500 text-blue-100',
        icon: EarthIcon,
        label: 'Visit URL'
      };
    default:
      throw assertNever(type);
  }
};
