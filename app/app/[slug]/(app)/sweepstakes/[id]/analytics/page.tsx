'use server';

import { SweepstakesAnalytics } from '@/components/sweepstakes-details/sweepstakes-analytics';
import getSweepstakesEntryTimeSeries from '@/procedures/sweepstakes/get-sweepstakes-entry-time-series';
import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import React, { Suspense } from 'react';

interface SweepstakesDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: SweepstakesDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense
      key={`${id}/analytics`}
      fallback={<div>Loading analytics...</div>}
    >
      <Wrapper id={id} />
    </Suspense>
  );
}

const Wrapper: React.FC<{ id: string }> = async ({ id }) => {
  const participant = await getParticipantSweepstake({ id });
  const timeseries = await getSweepstakesEntryTimeSeries({ id });

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
  return (
    <SweepstakesAnalytics {...participant.data} timeseries={timeseries.data} />
  );
};
