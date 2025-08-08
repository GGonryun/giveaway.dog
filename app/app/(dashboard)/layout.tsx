import { PlusIcon } from 'lucide-react';
import { Outline } from '../outline';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/patterns/app-sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Outline
          title="Dashboard"
          action={
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="flex -mt-0.5"
            >
              <Link href={'/app/host'}>
                <PlusIcon />
                New Sweepstakes
              </Link>
            </Button>
          }
        >
          {children}
        </Outline>
      </SidebarInset>
    </SidebarProvider>
  );
}
