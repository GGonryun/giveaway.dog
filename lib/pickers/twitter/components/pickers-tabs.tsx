'use client';

import { useSweepstakesPage } from '@/components/sweepstakes/use-sweepstakes-page';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useState } from 'react';
import { ListPickersFilterSchema } from '../schemas/list';
import { PICKER_FILTER_STATUS_OPTIONS } from '../../shared/schemas/status';

export const PickersTabs: React.PC<{
  filters: ListPickersFilterSchema;
}> = ({ filters, children }) => {
  const page = useSweepstakesPage();
  const [tab, setTab] = useState<ListPickersFilterSchema['status']>(
    filters.status
  );

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        setTab(value as ListPickersFilterSchema['status']);
        page.updateParams((params) => {
          params.set('status', value);
        });
      }}
    >
      <TabsList>
        {Object.entries(PICKER_FILTER_STATUS_OPTIONS).map(([key, label]) => (
          <TabsTrigger key={key} value={key}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="space-y-4">{children}</div>
    </Tabs>
  );
};
