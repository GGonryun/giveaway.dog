'use client';

import { UserSettings } from './user-profile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useState } from 'react';
import { LogoutButton } from './logout-button';
import { DangerZone } from './danger-zone';
import { FeatureSettings } from './feature-settings';
import { HistorySettings } from './history-settings';

type AccountSections = 'profile' | 'linked-accounts';

const tabItems = [
  { id: 'profile', label: 'Profile' },
  { id: 'history', label: 'History' },
  { id: 'features', label: 'Features' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'danger-zone', label: 'Danger Zone' }
];

export const dynamic = 'force-dynamic';

export const UserPage: React.FC = () => {
  const [activeSection, setActiveSection] =
    useState<AccountSections>('profile');

  return (
    <div className="py-4 space-y-4 container">
      <Tabs
        value={activeSection}
        onValueChange={(value) => setActiveSection(value as AccountSections)}
      >
        <TabsList>
          {tabItems.map((item) => {
            return (
              <TabsTrigger key={item.id} value={item.id}>
                {item.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <UserSettings />
        </TabsContent>
        <TabsContent value="history" className="mt-0">
          <HistorySettings />
        </TabsContent>
        <TabsContent value="features" className="mt-0">
          <FeatureSettings />
        </TabsContent>
        <TabsContent value="notifications" className="mt-0">
          <div className="p-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
            Notification settings coming soon!
          </div>
        </TabsContent>
        <TabsContent value="danger-zone" className="mt-0">
          <DangerZone />
        </TabsContent>

        <LogoutButton />
      </Tabs>
    </div>
  );
};
