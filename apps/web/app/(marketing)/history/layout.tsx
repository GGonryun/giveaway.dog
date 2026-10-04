import { MarketingPageHeader } from '@giveaway/marketing-ui/marketing/marketing-page-header';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full py-6 sm:py-12 container space-y-8 sm:space-y-12">
      <div className="mb-8">
        <MarketingPageHeader
          title="Giveaway History"
          description="Browse historical records of completed giveaways and see past winners"
        />
      </div>
      {children}
    </div>
  );
}
