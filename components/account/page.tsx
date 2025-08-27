'use client';

import {
  UserIcon,
  SettingsIcon,
  LoaderCircleIcon,
  LogOutIcon
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useLogout } from '../auth/use-logout';
import { UserOverview } from './user-overview';
import { UserSettings } from './user-settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { UserSection } from '@/schemas/account';

const tabItems = [
  { id: 'overview', label: 'Overview', icon: UserIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon }
];

export const UserPage: React.FC<{ tab: UserSection }> = ({ tab }) => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<UserSection>(tab);
  const logout = useLogout();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTabChange = (value: string) => {
    const newTab = value as UserSection;
    setActiveSection(newTab);

    // Update the URL query parameter without a full page reload
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    const newUrl = `${pathname}?${params.toString()}`;

    // Use replace to avoid adding to history stack for each tab change
    router.replace(newUrl, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile and settings
        </p>
      </div>

      <Tabs value={activeSection} onValueChange={handleTabChange}>
        <div className="w-full overflow-x-auto">
          <TabsList className="inline-flex h-auto p-1 min-w-full">
            {tabItems.map((item) => {
              const Icon = item.icon;
              return (
                <TabsTrigger
                  key={item.id}
                  value={item.id}
                  className="flex md:flex-col items-center md:space-y-1 space-x-2 md:space-x-0 p-2 md:p-3 data-[state=active]:bg-background whitespace-nowrap flex-shrink-0"
                >
                  <Icon className="h-4 w-4 md:block hidden" />
                  <span className="text-sm md:text-xs font-medium">
                    {item.label}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="mt-6">
          <TabsContent value="overview" className="mt-0">
            <UserOverview />
          </TabsContent>
          <TabsContent value="settings" className="mt-0">
            <UserSettings />
          </TabsContent>
        </div>
      </Tabs>

      {/* Logout Button */}
      <div className="flex justify-end">
        <Button
          onClick={logout.run}
          disabled={logout.isLoading}
          variant="outline"
          className="w-full sm:w-auto"
        >
          {logout.isLoading ? (
            <LoaderCircleIcon className="animate-spin h-4 w-4 mr-2" />
          ) : (
            <LogOutIcon className="h-4 w-4 mr-2" />
          )}
          Logout
        </Button>
      </div>
    </div>
  );
};
