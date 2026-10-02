import { MarketingPageHeader } from '@/components/marketing/marketing-page-header';

export default function WinnersLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full py-6 sm:py-12 pb-16 container space-y-8">
      <MarketingPageHeader
        title="Winner Leaderboard"
        description="Top giveaway winners and their prize history"
      />
      {children}
    </div>
  );
}
