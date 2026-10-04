import { MarketingHeader } from '@/components/patterns/shared';
import { CallToAction } from '@/components/patterns/pricing-cta';
import { IntegrationsShowcase } from '@/lib/learn/integrations-showcase';
import { getServerTheme } from '@giveaway/theme-server/get-server-theme';

export default async function IntegrationsPage() {
  const theme = await getServerTheme();

  return (
    <div className="flex flex-col w-full">
      <div className="container mx-auto px-4 py-8 md:py-16 space-y-8 md:space-y-16">
        <MarketingHeader
          title={{
            text: 'Connect with your favorite platforms',
            highlight: 'favorite platforms'
          }}
          subtitle={{
            text: 'Use over 100 entry methods to create engaging giveaways and grow your audience across social media, gaming, and more.'
          }}
          actions={[]}
        />

        <IntegrationsShowcase initialTheme={theme} />
        <CallToAction />
      </div>
    </div>
  );
}
