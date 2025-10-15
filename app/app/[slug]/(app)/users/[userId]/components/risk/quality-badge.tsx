import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { QUALITY_THEME, QualityType } from '@/schemas/quality';

export const QualityBadge: React.PC<{
  type: QualityType;
  className?: string;
}> = ({ type, children, className }) => {
  const theme = QUALITY_THEME[type];
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-white border-0',
        `[a&]:hover:${theme.base}/90`,
        theme.base,
        className
      )}
    >
      {children}
    </Badge>
  );
};
