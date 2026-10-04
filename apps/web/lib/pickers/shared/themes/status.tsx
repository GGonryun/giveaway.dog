import { BadgeVariants } from '@giveaway/ui-primitives/badge';
import { PickerStatus } from '@prisma/client';
import {
  LucideIcon,
  FileEdit,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Pause,
  CircleDashed,
  Clock
} from 'lucide-react';

export const STATUS_ICONS: Record<PickerStatus, LucideIcon> = {
  DRAFT: FileEdit,
  CREATED: CircleDashed,
  SCHEDULED: Clock,
  PROCESSING: Loader2,
  PROCESSED: CheckCircle2,
  COMPLETE: CheckCircle2,
  CANCELLED: XCircle,
  FAILED: AlertCircle,
  SUSPENDED: Pause
};

export const STATUS_COLORS: Record<
  PickerStatus,
  { badge: 'default' | 'secondary' | 'destructive' | 'outline'; text: string }
> = {
  DRAFT: { badge: 'secondary', text: 'text-gray-600 dark:text-gray-400' },
  CREATED: { badge: 'default', text: 'text-gray-600 dark:text-gray-400' },
  SCHEDULED: { badge: 'default', text: 'text-gray-600 dark:text-gray-400' },
  PROCESSING: { badge: 'default', text: 'text-blue-600 dark:text-blue-400' },
  PROCESSED: {
    badge: 'outline',
    text: 'text-purple-600 dark:text-purple-400'
  },
  COMPLETE: { badge: 'default', text: 'text-green-600 dark:text-green-400' },
  CANCELLED: {
    badge: 'destructive',
    text: 'text-gray-600 dark:text-gray-400'
  },
  FAILED: { badge: 'destructive', text: 'text-red-600 dark:text-red-400' },
  SUSPENDED: { badge: 'outline', text: 'text-yellow-600 dark:text-yellow-400' }
};

export const STATUS_LABEL: Record<PickerStatus, string> = {
  DRAFT: 'Draft',
  CREATED: 'Created',
  SCHEDULED: 'Scheduled',
  PROCESSING: 'Processing',
  PROCESSED: 'Processed',
  COMPLETE: 'Complete',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
  SUSPENDED: 'Suspended'
};

export const STATUS_BADGE_VARIANT: Record<PickerStatus, BadgeVariants> = {
  DRAFT: 'secondary',
  CREATED: 'default',
  SCHEDULED: 'default',
  PROCESSING: 'info',
  PROCESSED: 'success',
  COMPLETE: 'success',
  CANCELLED: 'destructive',
  FAILED: 'destructive',
  SUSPENDED: 'warning'
};
