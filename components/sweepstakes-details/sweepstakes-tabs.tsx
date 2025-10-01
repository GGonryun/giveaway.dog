'use client';

import { Tabs } from '@/components/ui/tabs';
import React, { useState } from 'react';
import {
  OutlineTabsContent,
  OutlineTabsList,
  OutlineTabsTrigger
} from '@/components/app/outline-tabs';
import { widetype } from '@/lib/widetype';
import {
  isSweepstakesTab,
  SWEEPSTAKES_TAB_OPTIONS,
  SweepstakesTabSchema
} from '@/schemas/sweepstakes';
import { useSweepstakesDetailsPage } from '@/components/sweepstakes/use-sweepstakes-details-page';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { DEFAULT_SWEEPSTAKES_DETAILS_TAB } from '@/lib/settings';

export type SweepstakesDetailsFilters = { tab?: SweepstakesTabSchema };

export const SweepstakesDetailsTabs: React.PC<{ id: string }> = ({
  id,
  children
}) => {
  const pathname = usePathname();
  const specifiedTab = pathname.split('/').pop() as SweepstakesTabSchema;
  const page = useSweepstakesDetailsPage();

  const [tab, setTab] = useState<SweepstakesTabSchema>(
    specifiedTab || DEFAULT_SWEEPSTAKES_DETAILS_TAB
  );

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        if (isSweepstakesTab(value)) {
          page.setTab(id, value as SweepstakesTabSchema);
          setTab(value as SweepstakesTabSchema);
        } else {
          toast.error('Something went wrong. Contact support. (Error: 001)');
        }
      }}
    >
      <OutlineTabsList>
        {widetype.entries(SWEEPSTAKES_TAB_OPTIONS).map(([key, label]) => (
          <OutlineTabsTrigger key={key} value={key}>
            {label}
          </OutlineTabsTrigger>
        ))}
      </OutlineTabsList>

      <OutlineTabsContent>{children}</OutlineTabsContent>
    </Tabs>
  );
};
