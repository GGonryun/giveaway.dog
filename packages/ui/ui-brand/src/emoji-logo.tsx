'use client';

import { cn } from '@giveaway/ui-utils/utils';

export const EmojiLogo: React.FC<React.ComponentProps<'span'>> = ({
  className,
  ...props
}) => {
  return (
    <span
      role="img"
      aria-label="dog face"
      className={cn('text-7xl', className, 'leading-none')}
      {...props}
    >
      🐶
    </span>
  );
};
