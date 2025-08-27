'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { User, Settings, Bell, LogOut, LoaderCircle } from 'lucide-react';
import { UserOverview } from '@/components/account/user-overview';
import { UserSettings } from '@/components/account/user-settings';
import { UserNotifications } from '@/components/account/user-notifications';
import { useLogout } from '@/components/auth/use-logout';

type UserSection = 'overview' | 'settings' | 'notifications';

const tabItems = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell }
];

export default function UserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<UserSection>('overview');
  const logout = useLogout();

  // Get tab from URL params or default to 'overview'
  useEffect(() => {
    const tabParam = searchParams.get('tab') as UserSection;
    if (
      tabParam &&
      ['overview', 'settings', 'notifications'].includes(tabParam)
    ) {
      setActiveSection(tabParam);
    } else {
      setActiveSection('overview');
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    const newTab = value as UserSection;
    setActiveSection(newTab);

    const newUrl = new URL(window.location.href);
    if (newTab === 'overview') {
      // Remove tab param for default tab to keep URL clean
      newUrl.searchParams.delete('tab');
    } else {
      newUrl.searchParams.set('tab', newTab);
    }

    // Use replace to avoid adding to history stack for each tab change
    router.replace(newUrl.pathname + newUrl.search, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile, settings, and notifications
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
          <TabsContent value="notifications" className="mt-0">
            <UserNotifications />
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
            <LoaderCircle className="animate-spin h-4 w-4 mr-2" />
          ) : (
            <LogOut className="h-4 w-4 mr-2" />
          )}
          Logout
        </Button>
      </div>
    </div>
  );
}
