import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

export type SiteHeaderProps = {
  title: string;
  action?: React.ReactNode;
};
export const SiteHeader: React.FC<SiteHeaderProps> = ({ title, action }) => {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b sticky top-0 z-10 bg-background">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        {action && (
          <div className="ml-auto flex items-center gap-2">{action}</div>
        )}
      </div>
    </header>
  );
};
