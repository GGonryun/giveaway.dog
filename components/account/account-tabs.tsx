'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React, { useEffect, useState } from 'react';
import { widetype } from '@/lib/widetype';
import {
  isAccountTab,
  ACCOUNT_TAB_OPTIONS,
  AccountTabSchema
} from '@/schemas/account';
import { useAccountPage } from './use-account-page';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { DEFAULT_ACCOUNT_TAB } from '@/lib/settings';

const tabRegex = new RegExp('^/account(?:/([^/]+))?');
const matchAccountTab = (path: string): AccountTabSchema | null => {
  const data = tabRegex.exec(path)?.[1];

  if (data && isAccountTab(data)) {
    return data;
  }

  return null;
};

export const AccountTabs: React.PC = ({ children }) => {
  const pathname = usePathname();
  const specifiedTab = matchAccountTab(pathname);
  const page = useAccountPage();

  const [tab, setTab] = useState<AccountTabSchema>(
    specifiedTab ?? DEFAULT_ACCOUNT_TAB
  );

  useEffect(() => {
    if (specifiedTab) {
      setTab(specifiedTab);
    }
  }, [specifiedTab]);

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        if (isAccountTab(value)) {
          page.setTab(value);
          setTab(value);
        } else {
          toast.error('Something went wrong. Contact support. (Error: 002)');
        }
      }}
    >
      <TabsList>
        {widetype.entries(ACCOUNT_TAB_OPTIONS).map(([key, label]) => (
          <TabsTrigger key={key} value={key}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="space-y-4">{children}</div>
    </Tabs>
  );
};
