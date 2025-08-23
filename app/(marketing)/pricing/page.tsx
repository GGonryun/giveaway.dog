import { PricingHero } from './components/pricing-hero';
import { PricingCards } from './components/pricing-cards';
import { CompetitorComparison } from './components/competitor-comparison';
import { PricingFAQ } from './components/pricing-faq';
import { PricingCTA } from './components/pricing-cta';

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
