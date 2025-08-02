'use client';

import { cn } from '@/lib/utils';

export const EmojiLogo: React.FC<React.ComponentProps<'span'>> = ({
  className,
  ...props
}) => {
  return (
    <span
      role="img"
      aria-label="dog face"
      className={cn('leading-none text-7xl', className)}
      {...props}
    >
      🐶
    </span>
  );
};
