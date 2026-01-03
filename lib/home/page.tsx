import { Hero } from '@/components/patterns/hero';
import { PricingCTA } from '@/components/patterns/pricing-cta';
import { PricingSection } from '@/components/patterns/pricing-section';

import { IntegrationsSection } from './integrations-section';

export const HomePage = () => {
  return (
    <div className="flex flex-col w-full">
      <Hero />
      {/* <FeaturesSection /> */}

      <IntegrationsSection />

      <PricingSection />
      <div className="container">
        <PricingCTA />
      </div>
    </div>
  );
};
