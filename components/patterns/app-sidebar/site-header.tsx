import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';

export const SiteHeader: React.FC<{ title: string }> = ({ title }) => {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="secondary"
            asChild
            size="sm"
            className="hidden sm:flex -mt-0.5"
          >
            <Link href="/app/host">
              <PlusIcon />
              New Giveaway
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};
