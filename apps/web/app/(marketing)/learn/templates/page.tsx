import { MarketingHeader } from '@giveaway/marketing-ui/shared';
import { CallToAction } from '@giveaway/marketing-ui/pricing-cta';
import { TemplatesShowcase } from '@giveaway/marketing-learn/learn/templates-showcase';

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
