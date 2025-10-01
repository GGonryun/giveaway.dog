'use server';

import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import React, { Suspense } from 'react';
import { SweepstakesPromotion } from '@/components/sweepstakes-details/sweepstakes-promotion';

interface SweepstakesDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: SweepstakesDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<div>Loading promotion...</div>}>
      <Wrapper id={id} />
    </Suspense>
  );
}

const Wrapper: React.FC<{ id: string }> = async ({ id }) => {
  const result = await getParticipantSweepstake({ id });

  if (!result.ok) {
    return (
      <div>Failed to load sweepstakes promotion: {result.data.message}</div>
    );
  }
  return <SweepstakesPromotion {...result.data} />;
};
