import { environment } from '@/lib/environment';
import { Metadata } from 'next';

const appUrl = environment.appUrl();

export const metadata: Metadata = {
  title: 'Social Pickers - Import Sweepstakes Entries from Any Platform | Free',
  description:
    'Automate sweepstakes entry tracking across Reddit, Twitter/X, Facebook, Twitch, and more. Import and sync entries from external platforms into your giveaway pickers.',
  keywords: [
    'social pickers',
    'sweepstakes automation',
    'import giveaway entries',
    'reddit giveaway',
    'twitter giveaway import',
    'facebook contest sync',
    'twitch giveaway',
    'multi-platform sweepstakes',
    'entry tracking automation',
    'social media integration'
  ],
  openGraph: {
    title: 'Social Pickers - Import Sweepstakes from Any Platform',
    description:
      'Automate entry tracking across Reddit, X, Facebook, Twitch, and more. Import sweepstakes entries from external platforms seamlessly.',
    url: `${appUrl}/tools/pickers`,
    siteName: 'GiveawayDog',
    type: 'website',
    locale: 'en',
    images: [
      {
        url: `${appUrl}/api/og?title=Social%20Pickers`,
        width: 1200,
        height: 630,
        alt: 'Social Pickers Tool'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Social Pickers - Import Sweepstakes Entries',
    description:
      'Automate entry tracking across multiple platforms. Import from Reddit, X, Facebook, Twitch, and more.',
    images: [`${appUrl}/api/og?title=Social%20Pickers`]
  },
  alternates: {
    canonical: `${appUrl}/tools/pickers`
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
