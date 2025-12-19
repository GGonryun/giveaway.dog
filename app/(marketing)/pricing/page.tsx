import { PricingSection } from '@/components/patterns/pricing-section';
import { PricingCTA } from '@/components/patterns/pricing-cta';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | Giveaway.dog',
  description:
    'Simple, transparent pricing for giveaways. Choose between Creator (free) and Pro plans.',
  openGraph: {
    title: 'Pricing | Giveaway.dog',
    description:
      'Simple, transparent pricing for giveaways. Choose between Creator (free) and Pro plans.'
  }
};

export default function PricingPage() {
  return (
    <div className="container py-0 md:py-4 flex flex-col items-center justify-center">
      <PricingSection />
      <PricingCTA />
    </div>
  );
}
