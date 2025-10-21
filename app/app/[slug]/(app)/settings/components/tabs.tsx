'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Billing } from './billing';
import { CRMConnectors } from './crm-connectors';
import { Integrations } from './integrations';
import { Legal } from './legal';
import { OrgProfile } from './org-profile';
import { TeamRoles } from './team-roles';
import { TeamFeatures } from './team-features';
import { TeamFeatureFlagKeySchema } from '@/schemas/feature-flags';

const tabItems = [
  { id: 'profile', label: 'Profile' },
  { id: 'crm', label: 'CRM' },
  { id: 'billing', label: 'Billing' },
  { id: 'team', label: 'Team' },
  { id: 'features', label: 'Features' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'legal', label: 'Legal' }
];

interface SettingsTabsProps {
  teamFeatureFlags: TeamFeatureFlagKeySchema[];
}

export const SettingsTabs: React.FC<SettingsTabsProps> = ({
  teamFeatureFlags
}) => {
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
      <TabsContent value="features">
        <TeamFeatures teamFeatureFlags={teamFeatureFlags} />
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
