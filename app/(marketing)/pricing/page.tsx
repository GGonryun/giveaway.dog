import { PricingHero } from './components/pricing-hero';
import { PricingCards } from './components/pricing-cards';
import { CompetitorComparison } from './components/competitor-comparison';
import { PricingFAQ } from './components/pricing-faq';
import { PricingCTA } from './components/pricing-cta';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing - Affordable Giveaway Hosting | Giveaway.dog',
  description:
    'Simple, transparent pricing for hosting giveaways. Start with 10 free giveaways with all premium features. Pay only for what you need with our flexible pay-per-giveaway model.',
  openGraph: {
    title: 'Pricing - Affordable Giveaway Hosting | Giveaway.dog',
    description:
      'Simple, transparent pricing for hosting giveaways. Start with 10 free giveaways with all premium features. Pay only for what you need with our flexible pay-per-giveaway model.',
    type: 'website',
    images: [
      {
        url: '/api/og/pricing',
        width: 1200,
        height: 630,
        alt: 'Giveaway.dog Pricing'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing - Affordable Giveaway Hosting | Giveaway.dog',
    description:
      'Simple, transparent pricing for hosting giveaways. Start with 10 free giveaways with all premium features. Pay only for what you need with our flexible pay-per-giveaway model.',
    images: ['/api/og/pricing']
  }
};

export default function PricingPage() {
  return (
    <div className="bg-background container mx-auto">
      <div className="px-4 py-8 md:py-16">
        <PricingHero />
        <PricingCards />
        <CompetitorComparison />
        <PricingFAQ />
        <PricingCTA />
      </div>
    </div>
  );
}
