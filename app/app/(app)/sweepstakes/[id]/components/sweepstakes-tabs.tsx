'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SweepstakesPreview } from './sweepstakes-preview';
import { SweepstakesDetailAnalytics } from './sweepstakes-detail-analytics';
import { SweepstakesPromotion } from './sweepstakes-promotion';
import { SweepstakesEntries } from './sweepstakes-entries';
import { SweepstakesExport } from './sweepstakes-export';
import { SweepstakesSettings } from './sweepstakes-settings';
import { SweepstakesWinners } from './sweepstakes-winners';

interface SweepstakesTabsProps {
  sweepstakesId: string;
  sweepstakes: any;
  detailedAnalytics: any;
}

export const SweepstakesTabs = ({
  sweepstakesId,
  sweepstakes,
  detailedAnalytics
}: SweepstakesTabsProps) => {
  return (
    <Tabs defaultValue="analytics" className="space-y-6">
      <div className="w-full overflow-x-auto">
        <TabsList className="grid w-max grid-cols-7 lg:w-full">
          <TabsTrigger value="preview" className="whitespace-nowrap">
            Preview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="whitespace-nowrap">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="promotion" className="whitespace-nowrap">
            Promotion
          </TabsTrigger>
          <TabsTrigger value="entries" className="whitespace-nowrap">
            Entries
          </TabsTrigger>
          <TabsTrigger value="export" className="whitespace-nowrap">
            Export
          </TabsTrigger>
          <TabsTrigger value="settings" className="whitespace-nowrap">
            Settings
          </TabsTrigger>
          <TabsTrigger value="winners" className="whitespace-nowrap">
            Winners
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Preview Tab */}
      <TabsContent value="preview" className="space-y-6">
        <SweepstakesPreview sweepstakes={sweepstakes} />
      </TabsContent>

      {/* Analytics Tab */}
      <TabsContent value="analytics" className="space-y-6">
        <SweepstakesDetailAnalytics
          sweepstakesId={sweepstakesId}
          data={detailedAnalytics}
        />
      </TabsContent>

      {/* Promotion Tab */}
      <TabsContent value="promotion" className="space-y-6">
        <SweepstakesPromotion sweepstakes={sweepstakes} />
      </TabsContent>

      {/* Entries Tab */}
      <TabsContent value="entries" className="space-y-6">
        <SweepstakesEntries sweepstakesId={sweepstakesId} />
      </TabsContent>

      {/* Export Tab */}
      <TabsContent value="export" className="space-y-6">
        <SweepstakesExport sweepstakesId={sweepstakesId} />
      </TabsContent>

      {/* Settings Tab */}
      <TabsContent value="settings" className="space-y-6">
        <SweepstakesSettings sweepstakes={sweepstakes} />
      </TabsContent>

      {/* Winners Tab */}
      <TabsContent value="winners" className="space-y-6">
        <SweepstakesWinners sweepstakesId={sweepstakesId} />
      </TabsContent>
    </Tabs>
  );
};
