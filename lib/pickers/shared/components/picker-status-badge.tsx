import { Badge } from '@/components/ui/badge';
import { PickerStatus } from '../schemas/status';
import { cn } from '@/lib/utils';
import {
  STATUS_ICONS,
  STATUS_LABEL,
  STATUS_BADGE_VARIANT
} from '../themes/status';

export type PickerStatusBadgeProps = {
  status: PickerStatus;
  showIcon?: boolean;
};

export const PickerStatusBadge: React.FC<PickerStatusBadgeProps> = ({
  status,
  showIcon = true
}) => {
  const Icon = STATUS_ICONS[status];
  const label = STATUS_LABEL[status];
  const variant = STATUS_BADGE_VARIANT[status];

  return (
    <Badge variant={variant} className="gap-1.5 w-24">
      {showIcon && (
        <Icon
          className={cn(`h-3 w-3`, { 'animate-spin': status === 'PROCESSING' })}
        />
      )}
      <span>{label}</span>
    </Badge>
  );
};
