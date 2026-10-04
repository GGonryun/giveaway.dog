'use client';

import { Tabs, TabsList, TabsTrigger } from '@giveaway/ui-primitives/tabs';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  DEFAULT_SETTINGS_TAB,
  isSettingsTab,
  matchSettingsTab,
  SETTINGS_TAB_OPTIONS,
  SettingsTabSchema
} from '../schemas/tabs';
import { toast } from 'sonner';
import { widetype } from '@giveaway/util-types/widetype';

interface SettingsTabsProps {
  slug: string;
}

export const SettingsTabs: React.PC<SettingsTabsProps> = ({
  children,
  slug
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const specifiedTab = matchSettingsTab(pathname);

  const [tab, setTab] = useState<SettingsTabSchema>(
    specifiedTab ?? DEFAULT_SETTINGS_TAB
  );

  useEffect(() => {
    if (specifiedTab) {
      setTab(specifiedTab);
    }
  }, [specifiedTab]);

  const handleTabChange = (value: string) => {
    if (isSettingsTab(value)) {
      router.push(`/app/${slug}/settings/${value}`);
      setTab(value);
    } else {
      toast.error('Something went wrong. Contact support. (Error: CAM001)');
    }
  };

  return (
    <Tabs value={tab} onValueChange={handleTabChange}>
      <TabsList>
        {widetype.entries(SETTINGS_TAB_OPTIONS).map(([key, label]) => {
          return (
            <TabsTrigger key={key} value={key}>
              {label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      <div className="space-y-4">{children}</div>
    </Tabs>
  );
};
