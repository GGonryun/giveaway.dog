import { Badge } from '@/components/ui/badge';
import { BanIcon } from 'lucide-react';

export const MaxOfOneBadge = () => {
  return (
    <Badge variant="destructive" className="px-1.5 text-xs">
      <BanIcon />
      Max of 1
    </Badge>
  );
};
