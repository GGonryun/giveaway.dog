'use client';

import { Typography } from '@/components/ui/typography';
import { useState } from 'react';
import {
  AllGiveawaysFilters,
  FilterStatus,
  SortOption
} from './components/all-giveaways-filters';
import { AllGiveawaysGrid } from './components/all-giveaways-grid';
import { AllGiveawaysSearch } from './components/all-giveaways-search';
import { HostCTA } from './components/host-cta';
import { SubscriptionCTA } from './components/subscription-cta';

interface FilterOptions {
  status: FilterStatus;
  region: string | null;
  sortBy: SortOption;
}

export default function AllGiveawaysPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    region: 'all',
    sortBy: 'end-date-asc'
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  return (
    <div className="w-full bg-background py-6 sm:py-8 lg:py-12 px-2 space-y-8 sm:space-y-12 sm:container">
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
          <div className="lg:w-80 flex-shrink-0">
            <AllGiveawaysFilters onFiltersChange={handleFiltersChange} />
          </div>

          <div className="flex-1 min-w-0">
            <AllGiveawaysGrid
              searchQuery={searchQuery}
              statusFilter={filters.status}
              regionFilter={filters.region}
              sortBy={filters.sortBy}
            />
          </div>
        </div>
      </div>
      <SubscriptionCTA />
      <HostCTA />
    </div>
  );
}
