import { cn } from '@giveaway/ui-utils/utils';
import { LoaderCircleIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { shapes } from '@giveaway/ui-utils/foundations/shapes';

const spinnerVariants = cva('animate-spin', {
  variants: shapes,
  defaultVariants: {
    size: 'sm'
  }
});

type SpinnerProps = VariantProps<typeof spinnerVariants> & {
  className?: string;
};

export const Spinner: React.FC<SpinnerProps> = ({ className, size }) => (
  <LoaderCircleIcon className={cn(spinnerVariants({ size }), className)} />
);
