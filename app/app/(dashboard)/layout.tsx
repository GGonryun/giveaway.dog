import { Outline } from '../outline';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/patterns/app-sidebar';
import { CreateGiveawayButton } from '@/components/giveaway/create-giveaway-button';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Outline title="Dashboard" action={<CreateGiveawayButton />}>
          {children}
        </Outline>
      </SidebarInset>
    </SidebarProvider>
  );
}
