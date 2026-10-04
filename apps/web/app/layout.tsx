import './globals.css';
import { Toaster } from '@/components/ui/toaster';

import { Analytics } from '@vercel/analytics/react';
import { SessionProvider } from '@/components/context/auth-session-provider';
import { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme/theme-provider';

import { Figtree } from 'next/font/google';
import { UserMetricsCollector } from '@/components/user-metrics-collector';
import { environment } from '@giveaway/app-config/environment';
import { BLUESKY_EMBED_SCRIPT_URL } from '@/lib/bluesky/embed';
import { TurnstileProvider } from '@/lib/turnstile/provider';
import { THEME_STORAGE_KEY, DEFAULT_THEME } from '@/lib/theme/constants';

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans'
});

const appUrl = environment.appUrl();

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'GiveawayDog',
  description: 'Build better giveaways and contests',
  openGraph: {
    title: 'GiveawayDog',
    description: 'Build better giveaways and contests',
    url: 'https://giveaway.dog',
    siteName: 'GiveawayDog',
    type: 'website',
    locale: 'en',
    images: [
      {
        url: `${appUrl}/api/og`,
        width: 1200,
        height: 630,
        alt: 'GiveawayDog'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GiveawayDog',
    description: 'Build better giveaways and contests',
    images: [`${appUrl}/api/og`]
  }
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${figtree.variable}`} suppressHydrationWarning>
      <head>
        <script async src="https://platform.twitter.com/widgets.js"></script>
        <script async src={BLUESKY_EMBED_SCRIPT_URL}></script>
        <script
          async
          defer
          crossOrigin="anonymous"
          src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0"
        ></script>
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme={DEFAULT_THEME}
          enableSystem
          storageKey={THEME_STORAGE_KEY}
          disableTransitionOnChange
        >
          <SessionProvider>
            <TurnstileProvider>
              <UserMetricsCollector />
              <main>{children}</main>
              <Toaster />
            </TurnstileProvider>
          </SessionProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
