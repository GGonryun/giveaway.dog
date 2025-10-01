'use server';

import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import React, { Suspense } from 'react';
import { SweepstakesPreview } from '../../../../../../../components/sweepstakes-details/sweepstakes-preview';

interface SweepstakesDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: SweepstakesDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<div>Loading preview...</div>}>
      <Wrapper id={id} />
    </Suspense>
  );
}

const Wrapper: React.FC<{ id: string }> = async ({ id }) => {
  const result = await getParticipantSweepstake({ id });

  if (!result.ok) {
    return <div>Failed to load sweepstakes details: {result.data.message}</div>;
  }
  return <SweepstakesPreview {...result.data} />;
};
