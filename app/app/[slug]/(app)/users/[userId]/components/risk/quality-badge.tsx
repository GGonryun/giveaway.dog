import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { QUALITY_BADGE_VARIANT, QualityType } from '@/schemas/quality';

export const QualityBadge: React.PC<{
  type: QualityType;
  className?: string;
}> = ({ type, children, className }) => {
  const theme = QUALITY_BADGE_VARIANT[type];
  return (
    <Badge variant={theme} className={cn(className)}>
      {children}
    </Badge>
  );
};
