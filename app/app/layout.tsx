import { AppSidebar } from '@/components/patterns/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="transition-[width,height] ease-linear  h-full w-full">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
