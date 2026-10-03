'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { strings } from '@giveaway/util-strings/strings';
import { cn } from '@/lib/utils';

interface ObfuscatedEmailProps {
  email: string | null | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  canReveal?: boolean;
  className?: string;
}

export const ObfuscatedEmail: React.FC<ObfuscatedEmailProps> = ({
  email,
  size = 'sm',
  canReveal = true,
  className
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    if (isRevealed) {
      const timeout = setTimeout(() => {
        setIsRevealed(false);
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [isRevealed]);

  const handleToggle = () => {
    setIsRevealed(!isRevealed);
  };

  if (!email) {
    return null;
  }

  const textSize =
    size === 'xs'
      ? 'text-xs'
      : size === 'sm'
        ? 'text-sm'
        : size === 'md'
          ? 'text-md'
          : 'text-lg';

  const displayEmail = isRevealed ? email : strings.obfuscate(email);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn(textSize)}>{displayEmail}</span>
      {canReveal && (
        <Button
          onClick={handleToggle}
          variant="ghost"
          size="icon-sm"
          className="h-auto w-auto p-0 hover:bg-transparent"
          aria-label={isRevealed ? 'Hide email' : 'Reveal email'}
        >
          {isRevealed ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      )}
    </div>
  );
};
