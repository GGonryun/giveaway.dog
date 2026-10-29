'use client';

import { useSweepstakesPage } from '@giveaway/sweepstakes-routes/use-sweepstakes-page';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@giveaway/ui-primitives/tabs';
import {
  ListSweepstakesFilters,
  SWEEPSTAKES_FILTER_STATUS_OPTIONS,
  SweepstakesFilterStatus
} from '@giveaway/sweepstakes-model/sweepstakes';
import { useState } from 'react';

export const SweepstakesTabs: React.PC<{
  filters: ListSweepstakesFilters;
}> = ({ filters, children }) => {
  const page = useSweepstakesPage();
  const [tab, setTab] = useState<SweepstakesFilterStatus>(
    filters.status ?? 'ALL'
  );

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        setTab(value as SweepstakesFilterStatus);
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

      <TabsContent value={tab} className="space-y-4">
        {children}
      </TabsContent>
    </Tabs>
  );
};
