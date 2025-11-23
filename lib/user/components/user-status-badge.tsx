import { Badge } from '@/components/ui/badge';
import { StatusExplanationDialog } from '@/components/users/status-explanation-dialog';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type UserStatus =
  | 'active'
  | 'flagged'
  | 'blocked'
  | 'trusted'
  | 'winner'
  | 'valid'
  | 'partial';
type StatusConfig = {
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
  label: string;
  color: string;
};

const variants: Record<UserStatus, StatusConfig> = {
  active: {
    variant: 'default' as const,
    label: 'Active',
    color: 'text-green-600'
  },
  flagged: {
    variant: 'destructive' as const,
    label: 'Flagged',
    color: 'text-red-600'
  },
  blocked: {
    variant: 'secondary' as const,
    label: 'Blocked',
    color: 'text-gray-600'
  },
  trusted: {
    variant: 'default' as const,
    label: 'Trusted',
    color: 'text-blue-600'
  },
  winner: {
    variant: 'default' as const,
    label: 'Winner',
    color: 'text-yellow-600'
  },
  valid: {
    variant: 'outline' as const,
    label: 'Valid',
    color: 'text-green-600'
  },
  partial: {
    variant: 'secondary' as const,
    label: 'Partial',
    color: 'text-yellow-600'
  }
};

const clickableStatuses: Record<UserStatus, boolean> = {
  active: true,
  flagged: false,
  blocked: true,
  trusted: false,
  winner: false,
  valid: false,
  partial: false
};

export const UserStatusBadge: React.FC<{
  status: UserStatus;
}> = ({ status }) => {
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const config = variants[status] || variants.active;
  const clickable = clickableStatuses[status];

  return (
    <>
      <Badge
        variant={config.variant}
        className={cn(
          config.color,
          clickable ? `cursor-pointer hover:opacity-80 transition-opacity` : ''
        )}
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
