'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React, { useEffect, useState } from 'react';
import { widetype } from '@/lib/widetype';
import {
  isPickerTab,
  PICKER_TAB_OPTIONS,
  PickerTabSchema,
  DEFAULT_PICKER_TAB
} from '@/lib/pickers/schemas/tabs';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

const tabRegex = new RegExp('^/app/[^/]+/pickers/(?:twitter|x)/[^/]+(?:/([^/]+))?');

const matchPickerTab = (path: string): PickerTabSchema | null => {
  const data = tabRegex.exec(path)?.[1];

  if (data && isPickerTab(data)) {
    return data;
  }

  return null;
};

export const PickerDetailsTabs: React.PC<{ pickerId: string }> = ({
  pickerId,
  children
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const specifiedTab = matchPickerTab(pathname);

  const [tab, setTab] = useState<PickerTabSchema>(
    specifiedTab ?? DEFAULT_PICKER_TAB
  );

  useEffect(() => {
    if (specifiedTab) {
      setTab(specifiedTab);
    }
  }, [specifiedTab]);

  const handleTabChange = (value: string) => {
    if (isPickerTab(value)) {
      const slug = pathname.split('/')[2];
      const pickerType = pathname.split('/')[4];
      router.push(`/app/${slug}/pickers/${pickerType}/${pickerId}/${value}`);
      setTab(value);
    } else {
      toast.error('Something went wrong. Contact support. (Error: CAM001)');
    }
  };

  return (
    <Tabs value={tab} onValueChange={handleTabChange}>
      <TabsList>
        {widetype.entries(PICKER_TAB_OPTIONS).map(([key, label]) => (
          <TabsTrigger key={key} value={key}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="space-y-4">{children}</div>
    </Tabs>
  );
};
