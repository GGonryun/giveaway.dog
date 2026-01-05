'use server';

import { Hero } from '@/components/patterns/hero';
import { PricingCTA } from '@/components/patterns/pricing-cta';
import { PricingSection } from '@/components/patterns/pricing-section';
import { getServerTheme } from '../theme/get-server-theme';

import { IntegrationsSection } from './integrations-section';

export const HomePage = async () => {
  const theme = await getServerTheme();

  return (
    <div className="flex flex-col w-full">
      <Hero theme={theme} />
      {/* <FeaturesSection /> */}

      <IntegrationsSection theme={theme} />

      <PricingSection />
      <div className="container">
        <PricingCTA />
      </div>
    </div>
  );
};
