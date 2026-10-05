import { Badge } from '@giveaway/ui-primitives/badge';
import { PickerStatus } from '@giveaway/picker-model/schemas/status';
import { cn } from '@giveaway/ui-utils/utils';
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
