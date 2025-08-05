import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Sora, DM_Sans, Space_Mono, Space_Grotesk } from 'next/font/google';

import { Analytics } from '@vercel/analytics/react';
import { SessionProvider } from '@/components/providers/auth-session-provider';
import { cn } from '@/lib/utils';

const sora = Sora({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-sora'
});
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-dmsans'
});
const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-spacemon'
});

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
    <html
      lang="en"
      className={`${sora.variable} ${dmSans.variable} ${spaceMono.variable}`}
    >
      <body>
        <SessionProvider>
          <main className="flex min-h-screen w-full flex-col bg-background">
            {children}
          </main>
          <Toaster />
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
