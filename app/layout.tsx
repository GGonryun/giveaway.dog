import './globals.css';
import { Toaster } from '@/components/ui/toaster';

import { Analytics } from '@vercel/analytics/react';
import { SessionProvider } from '@/components/context/auth-session-provider';
import { Metadata } from 'next';

import { Figtree } from 'next/font/google';
import { UserMetricsCollector } from '@/components/user-metrics-collector';

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans'
});
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  title: 'GiveawayDog',
  description: 'Build better giveaways and contests',
  openGraph: {
    title: 'GiveawayDog',
    description: 'Build better giveaways and contests',
    url: 'https://giveaway.dog',
    siteName: 'GiveawayDog',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GiveawayDog',
    description: 'Build better giveaways and contests'
  }
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
          <UserMetricsCollector />
          <main>{children}</main>
          <Toaster />
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
