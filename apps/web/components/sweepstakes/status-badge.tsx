import { Badge } from '@giveaway/ui-primitives/badge';
import { differenceInDays, isAfter, isBefore } from 'date-fns';
import {
  ENDING_SOON_SWEEPSTAKE_THRESHOLD,
  NEW_SWEEPSTAKE_THRESHOLD,
  STARTING_SOON_SWEEPSTAKE_THRESHOLD
} from '@giveaway/app-config/settings';
import { DerivedSweepstakeStatus } from '@/schemas/sweepstakes';
import { assertNever } from '@giveaway/util-errors';

const getStatusConfig = ({ status }: SweepstakeStatusBadgeProps) => {
  switch (status) {
    case 'DRAFT':
      return {
        label: 'Draft',
        variant: 'secondary' as const,
        description: 'Your sweepstakes is being prepared'
      };
    case 'RUNNING':
      return {
        label: 'Active',
        variant: 'default' as const,
        description: 'Your sweepstakes is live'
      };
    case 'SCHEDULED':
      return {
        label: 'Scheduled',
        variant: 'outline' as const,
        description: 'Your sweepstakes is scheduled to start'
      };
    case 'EXPIRED':
      return {
        label: 'Expired',
        variant: 'destructive' as const,
        description: 'Your sweepstakes has ended'
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        variant: 'success' as const,
        description: 'Your sweepstakes is complete'
      };
    case 'ERROR':
      return {
        label: 'Error',
        variant: 'destructive' as const,
        description: 'There is an issue with your sweepstakes timing'
      };
    default:
      throw assertNever(status);
  }
};

export type SweepstakeStatusBadgeProps = {
  status: DerivedSweepstakeStatus;
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

  if (status === 'DRAFT') {
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
    return <Badge variant="default">Upcoming</Badge>;
  }

  const daysLeft = differenceInDays(end, now);
  const isEndingSoon = daysLeft <= ENDING_SOON_SWEEPSTAKE_THRESHOLD;
  const isNew = differenceInDays(now, start) <= NEW_SWEEPSTAKE_THRESHOLD;

  if (isEndingSoon) {
    return <Badge variant="destructive">Ending</Badge>;
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
