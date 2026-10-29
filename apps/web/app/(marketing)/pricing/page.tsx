import type { Metadata } from 'next';
import { PricingSection } from '@giveaway/marketing-ui/pricing-section';
import { FaqSection } from '@giveaway/marketing-ui/faq-section';

const description =
  'Compare the Giveaway.dog plans. Start free with the Creator plan, or get unlimited giveaways, public giveaways and a verified badge with Pro.';

export const metadata: Metadata = {
  title: 'Pricing | Giveaway.dog',
  description,
  openGraph: {
    title: 'Pricing | Giveaway.dog',
    description,
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing | Giveaway.dog',
    description
  }
};

export default function PricingPage() {
  return (
    <div className="flex flex-col w-full bg-background">
      <PricingSection />
      <FaqSection />
    </div>
  );
}
