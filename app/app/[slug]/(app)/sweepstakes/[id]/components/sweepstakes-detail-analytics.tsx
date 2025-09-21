'use client';

import { SweepstakesTimeSeriesChart } from './sweepstakes-time-series-chart';

interface SweepstakesDetailAnalyticsProps {
  sweepstakesId: string;
  data: any;
}

export const SweepstakesDetailAnalytics = ({
  sweepstakesId,
  data
}: SweepstakesDetailAnalyticsProps) => {
  return (
    <div className="space-y-6">
      {/* Charts Grid */}
      <SweepstakesTimeSeriesChart
        data={data.timeSeriesData}
        totalUniqueUsers={data.kpis.uniqueEntrants}
        totalEntries={data.kpis.entriesToday}
      />
    </div>
  );
};
