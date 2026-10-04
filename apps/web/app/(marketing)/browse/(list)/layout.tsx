import { MarketingPageHeader } from '@giveaway/marketing-ui/marketing/marketing-page-header';
import { HostCTA } from '@/components/sweepstakes-browse/components/host-cta';
import { SubscriptionCTA } from '@/components/sweepstakes-browse/components/subscription-cta';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full py-6 sm:py-12 container space-y-8 sm:space-y-12">
      <div className="mb-8">
        <MarketingPageHeader
          title="Browse Giveaways"
          description="Discover active, upcoming, and completed giveaways"
        />
      </div>
      {children}
      <SubscriptionCTA />
      <HostCTA />
    </div>
  );
}
