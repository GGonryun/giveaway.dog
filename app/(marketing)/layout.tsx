import findUser from '@/procedures/user/find-user';
import { Footer } from '@/components/patterns/footer';
import { NavigationBar } from '@/components/patterns/navigation-bar';

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await findUser();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-50 bg-background border-b">
        <NavigationBar user={user.ok ? user.data : null} />
      </div>
      <div className="flex grow">{children}</div>
      <div className="border-t">
        <Footer />
      </div>
    </div>
  );
}
