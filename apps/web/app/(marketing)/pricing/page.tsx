import { pageMetadata } from '@giveaway/marketing-model/page-metadata';
import { PricingSection } from '@giveaway/marketing-ui/pricing-section';
import { FaqSection } from '@giveaway/marketing-ui/faq-section';

const description =
  'Compare the Giveaway.dog plans. Start free with the Creator plan, or get unlimited giveaways, public giveaways and a verified badge with Pro.';

export const metadata = pageMetadata({
  title: 'Pricing | Giveaway.dog',
  description
});

export default function PricingPage() {
  return (
    <div className="flex flex-col w-full bg-background">
      <PricingSection />
      <FaqSection />
    </div>
  );
}
