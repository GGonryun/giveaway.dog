'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Billing } from './billing';
import { CRMConnectors } from './crm-connectors';
import { Integrations } from './integrations';
import { Legal } from './legal';
import { OrgProfile } from './org-profile';
import { TeamRoles } from './team-roles';

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
      <TabsList>
        {tabItems.map((item) => {
          return (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {/* Tab Content */}
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
    </Tabs>
  );
};
