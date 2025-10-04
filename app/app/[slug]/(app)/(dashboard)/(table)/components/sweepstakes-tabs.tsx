'use client';

import { useSweepstakesPage } from '@/components/sweepstakes/use-sweepstakes-page';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ListSweepstakesFilters,
  SWEEPSTAKES_FILTER_STATUS_OPTIONS
} from '@/schemas/sweepstakes';
import { useState } from 'react';

export const SweepstakesTabs: React.PC<{
  filters: ListSweepstakesFilters;
}> = ({ filters, children }) => {
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
    >
      <TabsList>
        {Object.entries(SWEEPSTAKES_FILTER_STATUS_OPTIONS).map(
          ([key, label]) => (
            <TabsTrigger key={key} value={key}>
              {label}
            </TabsTrigger>
          )
        )}
      </TabsList>

      <div className="space-y-4">{children}</div>
    </Tabs>
  );
};
