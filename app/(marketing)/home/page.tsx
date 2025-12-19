import { Hero } from '@/components/patterns/hero';
import { FeaturesSection } from '@/components/patterns/features-section';
import { PricingSection } from '@/components/patterns/pricing-section';
import { PricingCTA } from '@/components/patterns/pricing-cta';
import { environment } from '@/lib/environment';
import { Metadata } from 'next';
import { HomePage } from '@/lib/home/page';

const appUrl = environment.appUrl();

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

export default HomePage;
