'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React, { useEffect, useState } from 'react';
import { widetype } from '@/lib/widetype';
import {
  isUserDetailsTab,
  USER_DETAILS_TAB_OPTIONS,
  UserDetailsTabSchema
} from '@/schemas/user';
import { useUserDetailsPage } from '@/components/users/use-user-details-page';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { DEFAULT_USER_DETAILS_TAB } from '@/lib/settings';

export type UserDetailsFilters = { tab?: UserDetailsTabSchema };

const tabRegex = new RegExp('^/app/[^/]+/users/[^/]+(?:/([^/]+))?');
const matchUserDetailsTab = (path: string): UserDetailsTabSchema | null => {
  const data = tabRegex.exec(path)?.[1];

  if (data && isUserDetailsTab(data)) {
    return data;
  }

  return null;
};

export const UserDetailsTabs: React.FC<{
  id: string;
  children: React.ReactNode;
}> = ({ id, children }) => {
  const pathname = usePathname();
  const specifiedTab = matchUserDetailsTab(pathname);
  const page = useUserDetailsPage();

  const [tab, setTab] = useState<UserDetailsTabSchema>(
    specifiedTab ?? DEFAULT_USER_DETAILS_TAB
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
        if (isUserDetailsTab(value)) {
          page.setTab(id, value as UserDetailsTabSchema);
          setTab(value as UserDetailsTabSchema);
        } else {
          toast.error('Something went wrong. Contact support. (Error: 002)');
        }
      }}
    >
      <TabsList>
        {widetype.entries(USER_DETAILS_TAB_OPTIONS).map(([key, label]) => (
          <TabsTrigger key={key} value={key}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="space-y-4">{children}</div>
    </Tabs>
  );
};
