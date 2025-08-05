import { SiteHeader } from '@/components/patterns/app-sidebar/site-header';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader title="Dashboard" />
      <div className="h-full w-full">{children}</div>
    </>
  );
}
