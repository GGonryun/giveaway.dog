'use client';

import {
  OutlineTabsContent,
  OutlineTabsList,
  OutlineTabsTrigger
} from '@/components/app/outline-tabs';
import { useSweepstakesPage } from '@/components/sweepstakes/use-sweepstakes-page';
import { Tabs } from '@/components/ui/tabs';
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
      <OutlineTabsList>
        {Object.entries(SWEEPSTAKES_FILTER_STATUS_OPTIONS).map(
          ([key, label]) => (
            <OutlineTabsTrigger key={key} value={key}>
              {label}
            </OutlineTabsTrigger>
          )
        )}
      </OutlineTabsList>

      <OutlineTabsContent>{children}</OutlineTabsContent>
    </Tabs>
  );
};
