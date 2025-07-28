import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  CheckIcon,
  CircleAlertIcon,
  CircleIcon,
  CircleXIcon
} from 'lucide-react';
import { shapes } from '../foundations/shapes';
import { assertNever } from '@/lib/errors';

const stampVariants = cva(
  'flex items-center justify-center p-1 rounded-full text-white',
  {
    variants: {
      ...shapes,
      variant: {
        check: 'bg-success',
        warning: 'bg-warning',
        error: 'bg-error',
        info: 'bg-info/80'
      }
    },
    defaultVariants: {
      size: 'sm'
    }
  }
);

export type StampProps = { className?: string } & VariantProps<
  typeof stampVariants
>;
export type StampVariant = VariantProps<typeof stampVariants>['variant'];
export type StampComponent = React.FC<StampProps>;

export const stampIcon = (variant: StampProps['variant']) => {
  if (!variant) {
    return CircleIcon;
  }
  switch (variant) {
    case 'check':
      return CheckIcon;
    case 'warning':
      return CircleAlertIcon;
    case 'error':
      return CircleXIcon;
    case 'info':
      return CircleAlertIcon;
    default:
      throw assertNever(variant);
  }
};

export const Stamp: StampComponent = ({ className, size, variant }) => {
  const Icon = stampIcon(variant);
  return <Icon className={cn(stampVariants({ size, variant }), className)} />;
};
