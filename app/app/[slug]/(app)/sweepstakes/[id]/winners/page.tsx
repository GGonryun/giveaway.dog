'use server';

import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import React, { Suspense } from 'react';
import { SweepstakesWinners } from '@/components/sweepstakes-details/sweepstakes-winners';

interface SweepstakesDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: SweepstakesDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<div>Loading winners...</div>}>
      <Wrapper id={id} />
    </Suspense>
  );
}

const Wrapper: React.FC<{ id: string }> = async ({ id }) => {
  const result = await getParticipantSweepstake({ id });

  if (!result.ok) {
    return <div>Failed to load sweepstakes winners: {result.data.message}</div>;
  }
  return <SweepstakesWinners sweepstakesId={id} />;
};
