'use client';

import { useState } from 'react';

import { AllGiveawaysGrid } from './components/all-giveaways-grid';
import { AllGiveawaysSearch } from './components/all-giveaways-search';
import { HostCTA } from './components/host-cta';
import { SubscriptionCTA } from './components/subscription-cta';
import { PublicSweepstakeSchema } from '@/schemas/giveaway/public';
import { MarketingPageHeader } from '../marketing/marketing-page-header';
import { GiftIcon } from 'lucide-react';

export const SweepstakesPageContent: React.FC<{
  sweepstakes: PublicSweepstakeSchema[];
}> = ({ sweepstakes }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="w-full bg-background py-6 sm:py-12 container space-y-8 sm:space-y-12">
      <div className="mb-8">
        <MarketingPageHeader
          icon={GiftIcon}
          title="Browse Giveaways"
          description="Discover active, upcoming, and completed giveaways"
        />
      </div>

      <div className="space-y-6">
        <AllGiveawaysSearch
          onSearch={handleSearch}
          onClear={handleClearSearch}
        />

        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="flex-1 min-w-0">
            <AllGiveawaysGrid
              searchQuery={searchQuery}
              sweepstakes={sweepstakes}
            />
          </div>
        </div>
      </div>
      <SubscriptionCTA />
      <HostCTA />
    </div>
  );
};
