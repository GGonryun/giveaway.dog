import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import React from 'react';

export type SiteHeaderProps = {
  title: string;
  action?: React.ReactNode;
  type?: React.ButtonHTMLAttributes<HTMLButtonElement>['type'];
};
export const SiteHeaderWithTrigger: React.FC<SiteHeaderProps> = ({
  type,
  title,
  action
}) => {
  return (
    <SiteHeaderContent
      title={title}
      action={action}
      trigger={<SidebarTrigger className="-ml-1" type={type} />}
    />
  );
};
export type SiteHeaderContentProps = {
  title: string;
  action?: React.ReactNode;
  trigger?: React.ReactNode;
};

export const SiteHeaderContent: React.FC<SiteHeaderContentProps> = ({
  title,
  action,
  trigger
}) => {
  return (
    <SiteHeader>
      {trigger}
      {trigger && (
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
      )}
      <h1 className="text-base font-medium">{title}</h1>
      {action && (
        <div className="ml-auto flex items-center gap-2">{action}</div>
      )}
    </SiteHeader>
  );
};

export const SiteHeader: React.FC<{
  children: React.ReactNode | React.ReactNode[];
}> = ({ children }) => {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b sticky top-0 z-10 bg-background">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {children}
      </div>
    </header>
  );
};
