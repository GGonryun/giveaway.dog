'use client';

import { UserSettings } from './user-profile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useState } from 'react';
import { LogoutButton } from './logout-button';
import { DangerZone } from './danger-zone';
import { FeatureSettings } from './feature-settings';

type AccountSections = 'profile' | 'linked-accounts';

const tabItems = [
  { id: 'profile', label: 'Profile' },
  { id: 'features', label: 'Features' },
  { id: 'activity', label: 'Activity' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'danger-zone', label: 'Danger Zone' }
];

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
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="whitespace-nowrap flex-shrink-0 px-3 py-2"
              >
                {item.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <UserSettings />
        </TabsContent>
        <TabsContent value="features" className="mt-0">
          <FeatureSettings />
        </TabsContent>
        <TabsContent value="activity" className="mt-0">
          <div className="p-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
            Activity section coming soon!
          </div>
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
