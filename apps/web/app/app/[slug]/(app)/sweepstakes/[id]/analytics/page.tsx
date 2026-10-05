'use server';

import { SweepstakesAnalytics } from '@giveaway/sweepstakes-details-analytics/sweepstakes-analytics';
import { SweepstakesAnalyticsSkeleton } from '@giveaway/sweepstakes-details-analytics/sweepstakes-analytics-skeleton';
import getSweepstakesEntryTimeSeries from '@giveaway/sweepstakes-insights-server/get-sweepstakes-entry-time-series';
import getParticipantSweepstake from '@giveaway/participation-server/get-participant-sweepstake';
import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { getSweepstakesAllocations } from '@giveaway/allocation-server/get-sweepstakes-allocations';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Analytics | Giveaway.dog',
    description: 'View sweepstakes analytics and insights',
    robots: {
      index: false,
      follow: false
    }
  };
}

interface SweepstakesDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: SweepstakesDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense
      key={`${id}/analytics`}
      fallback={<SweepstakesAnalyticsSkeleton />}
    >
      <Wrapper id={id} />
    </Suspense>
  );
}

const Wrapper: React.FC<{ id: string }> = async ({ id: sweepstakesId }) => {
  const participant = await getParticipantSweepstake({ sweepstakesId });
  const timeseries = await getSweepstakesEntryTimeSeries({ sweepstakesId });
  const allocations = await getSweepstakesAllocations({ sweepstakesId });

  if (!participant.ok) {
    return (
      <div>
        Failed to load sweepstakes analytics: {participant.data.message}
      </div>
    );
  }

  if (!timeseries.ok) {
    return (
      <div>
        Failed to load sweepstakes entry time series: {timeseries.data.message}
      </div>
    );
  }

  if (!allocations.ok) {
    return (
      <div>
        Failed to load sweepstakes allocations: {allocations.data.message}
      </div>
    );
  }

  return (
    <SweepstakesAnalytics
      {...participant.data}
      timeseries={timeseries.data}
      allocations={allocations.data}
    />
  );
};
