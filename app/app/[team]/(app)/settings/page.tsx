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
  { id: 'profile', label: 'Profile', icon: Building2 },
  { id: 'crm', label: 'CRM', icon: RefreshCw },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'integrations', label: 'Integrations', icon: Zap },
  { id: 'legal', label: 'Legal', icon: FileText }
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>('profile');

  return (
    <Outline title="Settings" container={true}>
      <div className="space-y-6">
        {/* Tabs Navigation */}
        <Tabs
          value={activeSection}
          onValueChange={(value) => setActiveSection(value as SettingsSection)}
        >
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

          {/* Tab Content */}
          <div className="mt-6">
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
