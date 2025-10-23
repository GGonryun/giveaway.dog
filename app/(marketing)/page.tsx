import { Hero } from '@/components/patterns/hero';
import { Metadata } from 'next';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Giveaway.dog - Create and Host Viral Giveaways & Contests',
  description:
    'The easiest way to create, manage, and host giveaways and contests. Grow your audience with viral social media giveaways, raffles, and sweepstakes. Start free today!',
  keywords: [
    'giveaway',
    'contest',
    'raffle',
    'sweepstakes',
    'social media giveaway',
    'viral marketing',
    'audience growth',
    'free giveaway tool'
  ],
  openGraph: {
    title: 'Giveaway.dog - Create and Host Viral Giveaways & Contests',
    description:
      'The easiest way to create, manage, and host giveaways and contests. Grow your audience with viral social media giveaways.',
    type: 'website',
    url: 'https://giveaway.dog',
    siteName: 'Giveaway.dog',
    images: [
      {
        url: `${appUrl}/api/og`,
        width: 1200,
        height: 630,
        alt: 'Giveaway.dog'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Giveaway.dog - Create and Host Viral Giveaways & Contests',
    description:
      'The easiest way to create, manage, and host giveaways and contests. Grow your audience with viral social media giveaways.',
    images: [`${appUrl}/api/og`]
  }
};

export default async function Page() {
  return <Hero />;
}
