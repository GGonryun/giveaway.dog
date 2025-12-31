import { Badge } from '@/components/ui/badge';
import { ZapIcon } from 'lucide-react';

export const InstantBadge = () => (
  <Badge variant="info">
    <ZapIcon /> <span className="hidden sm:inline">Instant</span>
  </Badge>
);
