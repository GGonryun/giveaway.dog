import { Badge } from '@/components/ui/badge';
import { ImportIcon } from 'lucide-react';

export const ImportBadge: React.FC = () => {
  return (
    <Badge variant="secondary" className="px-1.5 text-xs">
      <ImportIcon />
      Import
    </Badge>
  );
};
