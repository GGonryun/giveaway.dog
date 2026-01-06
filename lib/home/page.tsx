'use server';

import { Hero } from '@/components/patterns/hero';
import { CallToAction } from '@/components/patterns/pricing-cta';
import { PricingSection } from '@/components/patterns/pricing-section';
import { IntegrationsSection } from './integrations-section';
import { FeaturesSection } from './features-section';
import { UsageSection } from './usage-section';
import { FaqSection } from '@/components/patterns/faq-section';

export const HomePage = async () => {
  return (
    <div
      className="relative flex flex-col w-full bg-background min-h-screen"
      style={{
        backgroundImage: `repeating-linear-gradient(0deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 60px),
                         repeating-linear-gradient(90deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 60px)`,
        backgroundSize: '60px 60px',
        opacity: 1
      }}
    >
      <div
        className="absolute inset-0 bg-background pointer-events-none"
        style={{ opacity: 0.97 }}
      />
      <div className="relative z-10">
        <Hero />
        <IntegrationsSection />
        <UsageSection />
        <FeaturesSection />
        <PricingSection />
        <FaqSection />
        <div className="container py-16 md:py-24">
          <CallToAction />
        </div>
      </div>
    </div>
  );
};
