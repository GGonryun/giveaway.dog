import { Badge, BadgeVariants } from '@giveaway/ui-primitives/badge';
import { StatusExplanationDialog } from '../../status-explanation-dialog';
import { cn } from '@giveaway/ui-utils/utils';
import { UserStatusSchema } from '@giveaway/participant-model/participant';
import { useState } from 'react';

type StatusConfig = {
  variant: BadgeVariants;
  label: string;
};

const variants: Record<UserStatusSchema, StatusConfig> = {
  active: {
    variant: 'success' as const,
    label: 'Active'
  },
  blocked: {
    variant: 'secondary' as const,
    label: 'Blocked'
  }
};

export const UserStatusBadge: React.FC<{
  status: UserStatusSchema;
}> = ({ status }) => {
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const config = variants[status] || variants.active;

  return (
    <>
      <Badge
        variant={config.variant}
        className={cn(`cursor-pointer hover:opacity-80 transition-opacity`)}
        onClick={(e) => {
          e.stopPropagation();
          setShowStatusDialog(true);
        }}
      >
        {config.label}
      </Badge>
      <StatusExplanationDialog
        open={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        status={status as 'active' | 'blocked'}
      />
    </>
  );
};
