'use client';

import { Typography } from '@/components/ui/typography';
import { useState } from 'react';

import { AllGiveawaysGrid } from './components/all-giveaways-grid';
import { AllGiveawaysSearch } from './components/all-giveaways-search';
import { HostCTA } from './components/host-cta';
import { SubscriptionCTA } from './components/subscription-cta';
import { PublicSweepstakeSchema } from '@/schemas/giveaway/public';

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
    <div className="w-full bg-background py-6 sm:py-8 lg:py-12 px-4 space-y-8 sm:space-y-12 sm:container">
      <div className="text-center space-y-1 mb-8">
        <Typography.Header
          level={1}
          className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold"
        >
          All Giveaways
        </Typography.Header>
        <Typography className="text-muted-foreground text-base md:text-lg">
          Discover active, upcoming, and completed giveaways
        </Typography>
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
