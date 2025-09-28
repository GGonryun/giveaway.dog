'use client';

import {
  OutlineTabsList,
  OutlineTabsTrigger,
  OutlineTabsContent
} from '@/components/app/outline-tabs';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useState } from 'react';
import { Billing } from './billing';
import { CRMConnectors } from './crm-connectors';
import { Integrations } from './integrations';
import { Legal } from './legal';
import { OrgProfile } from './org-profile';
import { TeamRoles } from './team-roles';

type SettingsSection =
  | 'profile'
  | 'crm'
  | 'billing'
  | 'team'
  | 'integrations'
  | 'legal';

const tabItems = [
  { id: 'profile', label: 'Profile' },
  { id: 'crm', label: 'CRM' },
  { id: 'billing', label: 'Billing' },
  { id: 'team', label: 'Team' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'legal', label: 'Legal' }
];

export const SettingsTabs: React.FC = () => {
  return (
    <Tabs defaultValue="profile">
      <OutlineTabsList>
        {tabItems.map((item) => {
          return (
            <OutlineTabsTrigger key={item.id} value={item.id}>
              {item.label}
            </OutlineTabsTrigger>
          );
        })}
      </OutlineTabsList>

      {/* Tab Content */}
      <OutlineTabsContent>
        <TabsContent value="profile">
          <OrgProfile />
        </TabsContent>
        <TabsContent value="crm">
          <CRMConnectors />
        </TabsContent>
        <TabsContent value="billing">
          <Billing />
        </TabsContent>
        <TabsContent value="team">
          <TeamRoles />
        </TabsContent>
        <TabsContent value="integrations">
          <Integrations />
        </TabsContent>
        <TabsContent value="legal">
          <Legal />
        </TabsContent>
      </OutlineTabsContent>
    </Tabs>
  );
};
