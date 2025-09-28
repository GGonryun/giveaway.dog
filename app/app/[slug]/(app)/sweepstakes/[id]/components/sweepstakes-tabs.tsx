'use client';

import { Tabs, TabsContent } from '@/components/ui/tabs';
import { SweepstakesPreview } from './sweepstakes-preview';
import { SweepstakesDetailAnalytics } from './sweepstakes-detail-analytics';
import { SweepstakesPromotion } from './sweepstakes-promotion';
import { SweepstakesEntries } from './sweepstakes-entries';
import { SweepstakesExport } from './sweepstakes-export';
import { SweepstakesSettings } from './sweepstakes-settings';
import { SweepstakesWinners } from './sweepstakes-winners';
import {
  SweepstakesDetailsProvider,
  SweepstakesDetailsProviderProps,
  useSweepstakesDetailsContext
} from './use-sweepstakes-details-context';
import { useState } from 'react';
import {
  OutlineTabsContent,
  OutlineTabsList,
  OutlineTabsTrigger
} from '@/components/app/outline-tabs';

// Mock data for individual sweepstakes
const mockSweepstakesDetails = {
  id: '1',
  title: 'iPhone 15 Pro Max Giveaway',
  description:
    'Win the latest iPhone 15 Pro Max in Titanium Blue. Enter now for your chance to win this incredible device worth over $1,200!',
  status: 'active' as const,
  prize: '$1,200 iPhone 15 Pro Max',
  entries: 5432,
  uniqueEntrants: 4789,
  conversionRate: 7.8,
  botRate: 8.2,
  timeLeft: '5 days 12 hours',
  createdAt: '2025-01-01',
  endsAt: '2025-01-15T23:59:59Z',
  topSource: 'Instagram',
  landingPageUrl: 'https://giveaway.dog/iphone-15-pro-max',
  shareUrl: 'https://giveaway.dog/share/iphone-15-pro-max',
  thumbnailUrl: '/placeholder-iphone.jpg'
};

const SweepstakesTabs = () => {
  const { sweepstakesId } = useSweepstakesDetailsContext();
  const [value, setValue] = useState('analytics');

  return (
    <Tabs value={value} onValueChange={setValue}>
      <OutlineTabsList>
        {[
          { label: 'Preview', value: 'preview' },
          { label: 'Analytics', value: 'analytics' },
          { label: 'Promotion', value: 'promotion' },
          { label: 'Entries', value: 'entries' },
          { label: 'Winners', value: 'winners' },
          { label: 'Export', value: 'export' },
          { label: 'Settings', value: 'settings' }
        ].map(({ label, value }) => (
          <OutlineTabsTrigger key={value} value={value}>
            {label}
          </OutlineTabsTrigger>
        ))}
      </OutlineTabsList>

      <OutlineTabsContent>
        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <SweepstakesPreview />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <SweepstakesDetailAnalytics />
        </TabsContent>

        {/* Promotion Tab */}
        <TabsContent value="promotion" className="space-y-6">
          <SweepstakesPromotion sweepstakes={mockSweepstakesDetails} />
        </TabsContent>

        {/* Entries Tab */}
        <TabsContent value="entries" className="space-y-6">
          <SweepstakesEntries sweepstakesId={sweepstakesId} />
        </TabsContent>

        {/* Winners Tab */}
        <TabsContent value="winners" className="space-y-6">
          <SweepstakesWinners sweepstakesId={sweepstakesId} />
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <SweepstakesExport sweepstakesId={sweepstakesId} />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <SweepstakesSettings sweepstakes={mockSweepstakesDetails} />
        </TabsContent>
      </OutlineTabsContent>
    </Tabs>
  );
};

export const SweepstakesTabsWrapper: React.FC<
  SweepstakesDetailsProviderProps
> = (props) => {
  return (
    <SweepstakesDetailsProvider {...props}>
      <SweepstakesTabs />
    </SweepstakesDetailsProvider>
  );
};
