import { Badge, BadgeVariants } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

export const SelectTaskBadge: React.FC<{
  variant: BadgeVariants;
  Icon?: LucideIcon;
  label: string;
}> = ({ variant, Icon, label }) => (
  <Badge variant={variant} className="px-1.5 text-xs">
    {Icon && <Icon className="mr-0.5" />} {label}
  </Badge>
);
