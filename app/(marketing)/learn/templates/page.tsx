import { MarketingHeader } from '@/components/patterns/shared';
import { CallToAction } from '@/components/patterns/pricing-cta';
import { TemplatesShowcase } from '@/lib/learn/templates-showcase';

export default function TemplatesPage() {
  return (
    <div className="flex flex-col w-full">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <MarketingHeader
          title={{
            text: 'Kickstart with official templates',
            highlight: 'official templates'
          }}
          subtitle={{
            text: 'Save time with professionally designed giveaway templates tailored for different platforms and goals.'
          }}
          actions={[]}
        />

        <div className="mt-12">
          <TemplatesShowcase />
        </div>
      </div>
      <CallToAction />
    </div>
  );
}
