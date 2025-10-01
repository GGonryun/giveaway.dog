'use server';

import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import React, { Suspense } from 'react';
import { SweepstakesUsers } from '@/components/sweepstakes-details/sweepstakes-users';

interface SweepstakesDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: SweepstakesDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<div>Loading users...</div>}>
      <Wrapper id={id} />
    </Suspense>
  );
}

const Wrapper: React.FC<{ id: string }> = async ({ id }) => {
  const result = await getParticipantSweepstake({ id });

  if (!result.ok) {
    return <div>Failed to load sweepstakes users: {result.data.message}</div>;
  }
  return <SweepstakesUsers sweepstakesId={id} />;
};
