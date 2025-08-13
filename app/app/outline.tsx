import {
  SiteHeaderWithTrigger,
  SiteHeaderProps
} from '@/components/patterns/app-sidebar/site-header';
import { cn } from '@/lib/utils';

export const Outline: React.PC<
  SiteHeaderProps & { container?: boolean; className?: string }
> = ({ className, children, container = true, ...props }) => {
  return (
    <>
      <SiteHeaderWithTrigger {...props} />
      <div
        className={cn(
          'py-4 sm:py-8',
          container && 'sm:container px-2',
          className
        )}
      >
        {children}
      </div>
    </>
  );
};
