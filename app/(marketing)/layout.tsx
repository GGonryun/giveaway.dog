import findUser from '@/procedures/app/find-user';
import { Footer } from '@/components/patterns/footer';
import { NavigationBar } from '@/components/patterns/navigation-bar';

export const metadata = {
  title: 'GiveawayDog',
  description: 'Build better giveaways and contests'
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await findUser();

  return (
    <div className="min-h-screen flex flex-col h-screen">
      <div className="border-b">
        <NavigationBar user={user.ok ? user.data : null} />
      </div>
      <div className="flex grow">{children}</div>
      <div className="border-t">
        <Footer />
      </div>
    </div>
  );
}
