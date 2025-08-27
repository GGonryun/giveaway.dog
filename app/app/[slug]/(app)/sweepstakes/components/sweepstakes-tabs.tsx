'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ListSweepstakesFilters,
  SWEEPSTAKES_FILTER_STATUS_OPTIONS
} from '@/schemas/sweepstakes';
import { useSweepstakesPage } from './use-sweepstakes-page';
import { useState } from 'react';

export const SweepstakesTabs: React.FC<{
  filters: ListSweepstakesFilters;
}> = ({ filters }) => {
  const page = useSweepstakesPage();
  const [tab, setTab] = useState<ListSweepstakesFilters['status']>(
    filters.status
  );

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        setTab(value as ListSweepstakesFilters['status']);
        page.updateParams((params) => {
          params.set('status', value);
        });
      }}
      className="overflow-hidden -mx-2 sticky sm:relative top-16 sm:top-0 z-10 sm:z-0 bg-background"
    >
      <div className="overflow-x-auto">
        <TabsList className="border-l-0 border-r-0 border-t-0 sm:border-l sm:border-r sm:border-t inline-flex h-auto p-1 min-w-full">
          {Object.entries(SWEEPSTAKES_FILTER_STATUS_OPTIONS).map(
            ([key, label]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="whitespace-nowrap flex-shrink-0 px-3 py-2"
              >
                {label}
              </TabsTrigger>
            )
          )}
        </TabsList>
      </div>
    </Tabs>
  );
};
