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
  return (
    <div className="min-h-screen flex flex-col h-screen">
      <div>
        <NavigationBar />
      </div>
      <div className="flex grow items-center justify-center">
        {children}
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
