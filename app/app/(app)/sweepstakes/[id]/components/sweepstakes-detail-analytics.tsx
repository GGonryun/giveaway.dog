'use client';

import { SweepstakesKPICards } from './sweepstakes-kpi-cards';
import { SweepstakesTimeSeriesChart } from './sweepstakes-time-series-chart';
import { SweepstakesConversionFunnel } from './sweepstakes-conversion-funnel';
import { SweepstakesTopReferrers } from './sweepstakes-top-referrers';
import { SweepstakesBotPie } from './sweepstakes-bot-pie';

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
      {/* KPI Cards */}
      <SweepstakesKPICards data={data.kpis} />

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SweepstakesTimeSeriesChart data={data.timeSeriesData} />
        <SweepstakesTopReferrers data={data.referrerData} />
      </div>

      {/* Additional Analytics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SweepstakesConversionFunnel data={data.conversionFunnelData} />
        <SweepstakesBotPie data={data.botDetectionData} />
      </div>
    </div>
  );
};
