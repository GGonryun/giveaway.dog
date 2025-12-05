import { Badge, BadgeVariants } from '@/components/ui/badge';
import { IntegrationSchema } from '../schemas';

const BADGE_VARIANT: Record<IntegrationSchema['status'], BadgeVariants> = {
  ACTIVE: 'success',
  ERROR: 'destructive'
};

const BADGE_LABEL: Record<IntegrationSchema['status'], string> = {
  ACTIVE: 'Connected',
  ERROR: 'Broken'
};

export const IntegrationStatusBadge: React.FC<{
  status: IntegrationSchema['status'];
}> = ({ status }) => {
  const variant = BADGE_VARIANT[status];
  const label = BADGE_LABEL[status];

  return (
    <Badge variant={variant} className="text-xs">
      {label}
    </Badge>
  );
};
