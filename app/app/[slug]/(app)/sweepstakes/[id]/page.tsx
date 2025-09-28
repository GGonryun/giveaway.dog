'use server';

import { Suspense } from 'react';
import { SweepstakesTabsWrapper } from './components/sweepstakes-tabs';
import { Outline } from '@/components/app/outline';
import { EditGiveawayButton } from '@/components/sweepstakes/edit-giveaway-button';
import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import getSweepstakesEntryTimeSeries from '@/procedures/browse/get-sweepstakes-entry-time-series';

interface SweepstakesDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SweepstakesDetailPage({
  params
}: SweepstakesDetailPageProps) {
  const { id: sweepstakesId } = await params;
  const result = await getParticipantSweepstake({ id: sweepstakesId });
  const timeseries = await getSweepstakesEntryTimeSeries({ id: sweepstakesId });

  if (!result.ok) {
    return <div>Failed to load sweepstakes details: {result.data.message}</div>;
  }

  if (!timeseries.ok) {
    return (
      <div>
        Failed to load sweepstakes entry time series: {timeseries.data.message}
      </div>
    );
  }

  return (
    <Outline
      title={result.data.sweepstakes.setup.name}
      className="pt-0 sm:pt-0 sm:pb-8"
      container={false}
      action={<EditGiveawayButton sweepstakesId={sweepstakesId} />}
    >
      <Suspense>
        <SweepstakesTabsWrapper
          {...result.data}
          sweepstakesId={sweepstakesId}
          timeSeries={timeseries.data}
        />
      </Suspense>
    </Outline>
  );
}
