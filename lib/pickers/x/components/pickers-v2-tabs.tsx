'use client';

import { useSweepstakesPage } from '@/components/sweepstakes/use-sweepstakes-page';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { ListPickersV2FilterSchema } from '../schemas/list';
import { PICKER_FILTER_STATUS_OPTIONS } from '@/lib/pickers/shared/schemas/status';
import { PickerFilterStatus } from '@/lib/pickers/shared/schemas/status';

export const PickersV2Tabs: React.PC<{
  filters: ListPickersV2FilterSchema;
}> = ({ filters, children }) => {
  const page = useSweepstakesPage();
  const [tab, setTab] = useState<PickerFilterStatus>(
    filters.status ?? 'ALL'
  );

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        setTab(value as PickerFilterStatus);
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
