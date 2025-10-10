import { SweepstakesStatus } from '@prisma/client';
import { Badge } from '../ui/badge';
import {
  differenceInDays,
  formatDistance,
  formatDistanceToNowStrict,
  isAfter,
  isBefore
} from 'date-fns';
import {
  ENDING_SOON_SWEEPSTAKE_THRESHOLD,
  NEW_SWEEPSTAKE_THRESHOLD,
  STARTING_SOON_SWEEPSTAKE_THRESHOLD
} from '@/lib/settings';
import { Nullable } from '@/lib/types';

const getStatusConfig = ({
  startDate,
  endDate,
  status
}: SweepstakeStatusBadgeProps) => {
  const now = new Date();
  const hasStarted = isAfter(now, startDate);
  const hasEnded = isAfter(now, endDate);

  switch (status) {
    case SweepstakesStatus.DRAFT:
      return {
        label: 'Draft',
        variant: 'secondary' as const,
        description: 'Your sweepstakes is being prepared'
      };
    case SweepstakesStatus.ACTIVE:
      if (!hasStarted) {
        return {
          label: 'Scheduled',
          variant: 'outline' as const,
          description: 'Your sweepstakes is scheduled to start'
        };
      } else if (hasEnded) {
        return {
          label: 'Finished',
          variant: 'success' as const,
          description: 'Your sweepstakes has finished'
        };
      } else {
        return {
          label: 'Active',
          variant: 'default' as const,
          description: 'Your sweepstakes is live'
        };
      }
    case SweepstakesStatus.COMPLETED:
      return {
        label: 'Finished',
        variant: 'success' as const,
        description: 'Your sweepstakes has finished'
      };
    default:
      return {
        label: 'Unknown',
        variant: 'secondary' as const,
        description: 'Status unknown'
      };
  }
};

export type SweepstakeStatusBadgeProps = {
  status: SweepstakesStatus;
  startDate: Date;
  endDate: Date;
};

export const SweepstakesStatusBadge: React.FC<SweepstakeStatusBadgeProps> = (
  props
) => {
  const { label, variant } = getStatusConfig(props);
  return (
    <Badge variant={variant} className="text-sm">
      {label}
    </Badge>
  );
};

export const SweepstakesStatusSummaryBadge: React.FC<
  SweepstakeStatusBadgeProps
> = ({ startDate, endDate, status }) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const isEnded = isAfter(now, end);

  if (status === SweepstakesStatus.DRAFT) {
    return <Badge variant="secondary">Draft</Badge>;
  }

  if (isEnded) {
    return <Badge variant="success">Finished</Badge>;
  }

  const daysUntilStart = differenceInDays(start, now);
  const isStartingSoon =
    isBefore(now, start) &&
    daysUntilStart <= STARTING_SOON_SWEEPSTAKE_THRESHOLD;

  if (isStartingSoon) {
    return <Badge variant="default">Starting Soon</Badge>;
  }

  const daysLeft = differenceInDays(end, now);
  const isEndingSoon = daysLeft <= ENDING_SOON_SWEEPSTAKE_THRESHOLD;
  const isNew = differenceInDays(now, start) <= NEW_SWEEPSTAKE_THRESHOLD;

  if (isEndingSoon) {
    return <Badge variant="destructive">Ending Soon</Badge>;
  } else if (isNew) {
    return <Badge variant="secondary">New</Badge>;
  } else {
    return null;
  }
};

export const SweepstakesStatusDescription: React.FC<
  SweepstakeStatusBadgeProps
> = (props) => {
  const { description } = getStatusConfig(props);
  return <span>{description}</span>;
};

export const getSweepstakesTimingDescription = ({
  status,
  endDate,
  startDate
}: Nullable<Partial<SweepstakeStatusBadgeProps>>): string => {
  const now = new Date();
  if (!status || status === SweepstakesStatus.DRAFT) return 'Not started';
  if (!startDate || !endDate) return 'Not started';

  if (isAfter(now, endDate))
    return `Finished ${formatDistanceToNowStrict(endDate)} ago`;
  if (isAfter(startDate, now))
    return `Starts in ${formatDistanceToNowStrict(startDate)}`;
  return `Ends in ${formatDistance(endDate, now)}`;
};
