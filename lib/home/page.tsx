'use server';

import { Hero } from '@/components/patterns/hero';
import { PricingCTA } from '@/components/patterns/pricing-cta';
import { PricingSection } from '@/components/patterns/pricing-section';
import { IntegrationsSection } from './integrations-section';

export const HomePage = async () => {
  return (
    <div className="flex flex-col w-full bg-background ">
      <Hero />
      <IntegrationsSection />

      {/* <TemplatesSection /> */}

      <PricingSection />
      <div className="container py-16 md:py-24">
        <PricingCTA />
      </div>
    </div>
  );
};
