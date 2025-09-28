'use client';

import { useState } from 'react';
import { OrgProfile } from './components/org-profile';
import { CRMConnectors } from './components/crm-connectors';
import { Billing } from './components/billing';
import { TeamRoles } from './components/team-roles';
import { Integrations } from './components/integrations';
import { Legal } from './components/legal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  RefreshCw,
  CreditCard,
  Users,
  Zap,
  FileText
} from 'lucide-react';
import { Outline } from '@/components/app/outline';

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

export default function SettingsPage() {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>('profile');

  return (
    <Outline
      title="Settings"
      className="pt-0 sm:pt-0 sm:pb-8"
      container={false}
    >
      <div className="space-y-6">
        {/* Tabs Navigation */}
        <Tabs
          value={activeSection}
          onValueChange={(value) => setActiveSection(value as SettingsSection)}
        >
          <div className="overflow-x-auto sticky top-16 z-10 bg-background">
            <TabsList className="border-l-0 border-r-0 border-t-0 inline-flex h-auto p-1 min-w-full">
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
          </div>

          {/* Tab Content */}
          <div className="space-y-4 p-2 sm:p-4 sm:mx-auto sm:container">
            <TabsContent value="profile" className="mt-0">
              <OrgProfile />
            </TabsContent>
            <TabsContent value="crm" className="mt-0">
              <CRMConnectors />
            </TabsContent>
            <TabsContent value="billing" className="mt-0">
              <Billing />
            </TabsContent>
            <TabsContent value="team" className="mt-0">
              <TeamRoles />
            </TabsContent>
            <TabsContent value="integrations" className="mt-0">
              <Integrations />
            </TabsContent>
            <TabsContent value="legal" className="mt-0">
              <Legal />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Outline>
  );
}
