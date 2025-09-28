import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TabsTriggerProps } from '@radix-ui/react-tabs';

export const OutlineTabsTrigger: React.PC<
  Omit<TabsTriggerProps, 'className'>
> = ({ children, ...props }) => {
  return (
    <TabsTrigger
      {...props}
      className="whitespace-nowrap flex-shrink-0 px-3 py-2"
    >
      {children}
    </TabsTrigger>
  );
};

export const OutlineTabsList: React.PC = ({ children }) => {
  return (
    <div className="transition-[width,height,top] ease-linear overflow-x-auto sticky top-16 group-has-data-[collapsible=icon]/sidebar-wrapper:top-12 z-10 bg-background">
      <TabsList className="border-l-0 border-r-0 border-t-0 inline-flex h-auto p-1 min-w-full">
        {children}
      </TabsList>
    </div>
  );
};

export const OutlineTabsContent: React.PC = ({ children }) => {
  return (
    <div className="space-y-4 py-4 px-2 sm:mx-auto sm:container">
      {children}
    </div>
  );
};
