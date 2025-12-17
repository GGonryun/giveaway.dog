import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';

export const VerifiedBadge = () => {
  return (
    <Badge variant="success" className="px-1.5 text-xs">
      <ShieldCheck /> Verified
    </Badge>
  );
};
