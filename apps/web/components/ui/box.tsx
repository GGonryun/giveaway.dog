import { cn } from '@/lib/utils';
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

type BoxProps = React.ComponentProps<'div'> &
  VariantProps<typeof boxVariants> & {
    children: React.ReactNode;
  };

interface BoxComponent extends React.FC<BoxProps> {}

const boxVariants = cva('', {
  variants: {
    hidden: {
      true: 'hidden'
    },
    sx: {
      xs: 'space-x-1',
      sm: 'space-x-2',
      md: 'space-x-3',
      lg: 'space-x-4',
      xl: 'space-x-5'
    },
    sy: {
      xs: 'space-y-1',
      sm: 'space-y-2',
      md: 'space-y-3',
      lg: 'space-y-4',
      xl: 'space-y-5'
    },
    mb: {
      xs: 'mb-1',
      sm: 'mb-2',
      md: 'mb-3',
      lg: 'mb-4',
      xl: 'mb-5'
    },
    mt: {
      xs: 'mt-1',
      sm: 'mt-2',
      md: 'mt-3',
      lg: 'mt-4',
      xl: 'mt-5'
    },
    my: {
      xs: 'my-1',
      sm: 'my-2',
      md: 'my-3',
      lg: 'my-4',
      xl: 'my-5'
    },
    px: {
      xs: 'px-1',
      sm: 'px-2',
      md: 'px-3',
      lg: 'px-4',
      xl: 'px-5'
    },
    p: {
      xs: 'p-1',
      sm: 'p-2',
      md: 'p-3',
      lg: 'p-4',
      xl: 'p-5'
    },
    w: {
      8: 'w-8'
    }
  }
});

const Box: BoxComponent = ({
  className,
  children,
  hidden,
  sx,
  sy,
  mb,
  mt,
  my,
  px,
  p,
  w,
  ...props
}) => {
  return (
    <div
      className={cn(
        boxVariants({ sx, sy, mb, mt, my, px, p, w, hidden }),
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export { Box };
