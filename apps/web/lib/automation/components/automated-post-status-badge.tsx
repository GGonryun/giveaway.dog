import { Badge, BadgeVariants } from '@/components/ui/badge';
import { AutomatedPostJobStatus } from '@prisma/client';
import {
  CheckCircleIcon,
  ClockIcon,
  LucideIcon,
  XCircleIcon
} from 'lucide-react';

const STATUS_ICON: Record<AutomatedPostJobStatus, LucideIcon> = {
  PENDING: ClockIcon,
  COMPLETED: CheckCircleIcon,
  FAILED: XCircleIcon
};

const STATUS_VARIANT: Record<AutomatedPostJobStatus, BadgeVariants> = {
  PENDING: 'warning',
  COMPLETED: 'success',
  FAILED: 'destructive'
};

const STATUS_LABEL: Record<AutomatedPostJobStatus, string> = {
  PENDING: 'Scheduled',
  COMPLETED: 'Posted',
  FAILED: 'Failed'
};

export const AutomatedPostStatusBadge = ({
  status
}: {
  status: AutomatedPostJobStatus;
}) => {
  const Icon = STATUS_ICON[status];
  const label = STATUS_LABEL[status];
  const variant = STATUS_VARIANT[status];
  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
};
