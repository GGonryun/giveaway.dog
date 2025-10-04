import './globals.css';
import { Toaster } from '@/components/ui/toaster';

import { Analytics } from '@vercel/analytics/react';
import { SessionProvider } from '@/components/context/auth-session-provider';
import { Metadata } from 'next';

import { Figtree } from 'next/font/google';

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans'
});
export const metadata: Metadata = {
  title: 'GiveawayDog',
  description: 'Build better giveaways and contests'
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${figtree.variable}`}>
      <body>
        <SessionProvider>
          <main>{children}</main>
          <Toaster />
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
