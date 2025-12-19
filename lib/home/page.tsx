import { FeaturesSection } from '@/components/patterns/features-section';
import { Hero } from '@/components/patterns/hero';
import { PricingCTA } from '@/components/patterns/pricing-cta';
import { PricingSection } from '@/components/patterns/pricing-section';

export const HomePage = () => {
  return (
    <div className="flex flex-col w-full">
      <Hero />
      <FeaturesSection />
      <PricingSection />
      <div className="container">
        <PricingCTA />
      </div>
    </div>
  );
};
