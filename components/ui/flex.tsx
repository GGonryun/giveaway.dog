import { cn } from '@/lib/utils';
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { text } from '../foundations/text';

type StackProps = FlexProps;

type FlexProps = React.ComponentProps<'div'> &
  VariantProps<typeof flexVariants> & {
    children: React.ReactNode;
  };

interface FlexComponent extends React.FC<FlexProps> {
  Stack: React.FC<StackProps>;
}

const flexVariants = cva('flex', {
  variants: {
    gap: {
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-4',
      xl: 'gap-5'
    },
    full: {
      true: 'h-full w-full',
      width: 'w-full',
      height: 'h-full'
    },
    center: {
      true: 'items-center justify-center'
    },
    items: {
      center: 'items-center'
    }
  }
});

const Flex: FlexComponent = ({
  className,
  children,
  gap,
  full,
  center,
  ...props
}) => {
  return (
    <div
      className={cn(flexVariants({ gap, full, center }), className)}
      {...props}
    >
      {children}
    </div>
  );
};

Flex.Stack = ({ className, children, gap, full, center, ...props }) => {
  return (
    <div
      className={cn(flexVariants({ gap, full, center }), 'flex-col', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export { Flex };
