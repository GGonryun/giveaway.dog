import { AppSidebar } from '@giveaway/shell-sidebar/app-sidebar';

import { SidebarInset, SidebarProvider } from '@giveaway/ui-primitives/sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
