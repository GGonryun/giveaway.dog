"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SweepstakesDetailHeader } from "./components/sweepstakes-detail-header";
import { SweepstakesPreview } from "./components/sweepstakes-preview";
import { SweepstakesDetailAnalytics } from "./components/sweepstakes-detail-analytics";
import { SweepstakesPromotion } from "./components/sweepstakes-promotion";
import { SweepstakesEntries } from "./components/sweepstakes-entries";
import { SweepstakesExport } from "./components/sweepstakes-export";
import { SweepstakesSettings } from "./components/sweepstakes-settings";
import { SweepstakesWinners } from "./components/sweepstakes-winners";

// Mock data for individual sweepstakes
const mockSweepstakesDetails = {
  id: '1',
  title: 'iPhone 15 Pro Max Giveaway',
  description: 'Win the latest iPhone 15 Pro Max in Titanium Blue. Enter now for your chance to win this incredible device worth over $1,200!',
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

const mockDetailedAnalytics = {
  kpis: {
    entriesToday: 234,
    entriesTodayChange: 15.3,
    uniqueEntrants: 4789,
    uniqueEntrantsChange: 12.7,
    conversionRate: 7.8,
    conversionRateChange: -2.1,
    avgTimeToEntry: 87,
    avgTimeToEntryChange: -8.3,
    botRate: 8.2,
    botRateChange: 3.2,
    shareRate: 23.4,
    shareRateChange: 5.8
  },
  timeSeriesData: [
    { date: '2025-01-01', entries: 145, visits: 2340, conversions: 145 },
    { date: '2025-01-02', entries: 167, visits: 2890, conversions: 167 },
    { date: '2025-01-03', entries: 203, visits: 3120, conversions: 203 },
    { date: '2025-01-04', entries: 189, visits: 2950, conversions: 189 },
    { date: '2025-01-05', entries: 234, visits: 3450, conversions: 234 },
    { date: '2025-01-06', entries: 187, visits: 2780, conversions: 187 },
    { date: '2025-01-07', entries: 221, visits: 3210, conversions: 221 }
  ],
  conversionFunnelData: [
    { stage: 'Page Visits', value: 21840, percentage: 100, dropRate: 0 },
    { stage: 'Started Entry', value: 6890, percentage: 31.5, dropRate: 68.5 },
    { stage: 'Completed Form', value: 5432, percentage: 78.8, dropRate: 21.2 },
    { stage: 'Email Verified', value: 4789, percentage: 88.2, dropRate: 11.8 },
    { stage: 'Social Share', value: 1234, percentage: 25.8, dropRate: 74.2 }
  ],
  geoData: [
    { country: 'United States', entries: 2456, percentage: 45.2 },
    { country: 'Canada', entries: 987, percentage: 18.2 },
    { country: 'United Kingdom', entries: 654, percentage: 12.0 },
    { country: 'Australia', entries: 432, percentage: 8.0 },
    { country: 'Germany', entries: 321, percentage: 5.9 }
  ],
  deviceData: [
    { device: 'Mobile', entries: 3789, percentage: 69.8 },
    { device: 'Desktop', entries: 1234, percentage: 22.7 },
    { device: 'Tablet', entries: 409, percentage: 7.5 }
  ]
};

interface SweepstakesDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SweepstakesDetailPage({ params }: SweepstakesDetailPageProps) {
  const { id: sweepstakesId } = await params;
  
  return (
    <div className="space-y-6">
      {/* Header with key info and actions */}
      <SweepstakesDetailHeader sweepstakes={mockSweepstakesDetails} />
      
      {/* Main Content with Tabs */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="promotion">Promotion</TabsTrigger>
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="winners">Winners</TabsTrigger>
        </TabsList>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <SweepstakesPreview sweepstakes={mockSweepstakesDetails} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <SweepstakesDetailAnalytics 
            sweepstakesId={sweepstakesId}
            data={mockDetailedAnalytics} 
          />
        </TabsContent>

        {/* Promotion Tab */}
        <TabsContent value="promotion" className="space-y-6">
          <SweepstakesPromotion sweepstakes={mockSweepstakesDetails} />
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
          <SweepstakesSettings sweepstakes={mockSweepstakesDetails} />
        </TabsContent>

        {/* Winners Tab */}
        <TabsContent value="winners" className="space-y-6">
          <SweepstakesWinners sweepstakesId={sweepstakesId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}