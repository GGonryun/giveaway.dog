import './globals.css';
import { Toaster } from '@/components/ui/toaster';

import { Analytics } from '@vercel/analytics/react';
import { SessionProvider } from '@/components/providers/auth-session-provider';

export const metadata = {
  title: 'GiveawayDog',
  description: 'Build powerful interactive bots with ease'
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <main className="flex min-h-screen w-full flex-col my-4 container">
            {children}
          </main>
          <Toaster />
        </SessionProvider>

        <Analytics />
      </body>
    </html>
  );
}
