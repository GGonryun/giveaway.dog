import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { useCallback } from 'react';

export const IconButton: React.FC<{
  onClick?: (e: React.MouseEvent) => void;
  icon: LucideIcon;
}> = ({ onClick, icon: LucideIcon }) => {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (onClick) {
        e.stopPropagation();
        onClick(e);
      }
    },
    [onClick]
  );

  return (
    <Button
      variant="ghost"
      type="button"
      size="icon"
      className="h-8 w-8"
      onClick={handleClick}
    >
      <LucideIcon />
    </Button>
  );
};
