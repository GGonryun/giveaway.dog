import { DerivedSweepstakeStatus } from '@/schemas/sweepstakes';
import {
  Circle,
  CircleAlert,
  CircleCheck,
  CircleEllipsis,
  CirclePlay,
  CircleX,
  LucideIcon
} from 'lucide-react';
import React from 'react';
import { cn } from '@giveaway/ui-utils/utils';

export const DERIVED_STATUS_ICON: Record<DerivedSweepstakeStatus, LucideIcon> =
  {
    ERROR: CircleX,
    SCHEDULED: CircleEllipsis,
    RUNNING: CirclePlay,
    EXPIRED: CircleAlert,
    DRAFT: Circle,
    COMPLETED: CircleCheck
  };

export const DERIVED_STATUS_ICON_COLOR: Record<
  DerivedSweepstakeStatus,
  string
> = {
  ERROR: 'text-red-500',
  SCHEDULED: 'text-blue-500',
  RUNNING: 'text-green-500',
  EXPIRED: 'text-orange-500',
  DRAFT: 'text-gray-500',
  COMPLETED: 'text-purple-500'
};

export const DerivedStatusIcon: React.FC<{
  size?: number;
  status: DerivedSweepstakeStatus;
}> = ({ status, size }) => {
  const Icon = DERIVED_STATUS_ICON[status];
  const color = DERIVED_STATUS_ICON_COLOR[status];
  return <Icon className={cn(`size-${size}`, color)} />;
};
