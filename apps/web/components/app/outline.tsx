import {
  SiteHeaderWithTrigger,
  SiteHeaderProps
} from '@/components/patterns/app-sidebar/site-header';
import { cn } from '@giveaway/ui-utils/utils';

export const Outline: React.PC<
  SiteHeaderProps & { container?: boolean; className?: string }
> = ({ className, children, container = true, ...props }) => {
  return (
    <>
      <SiteHeaderWithTrigger {...props} />
      <div
        className={cn(
          'pt-4 pb-16 sm:pb-4',
          container && 'container',
          className
        )}
      >
        {children}
      </div>
    </>
  );
};
