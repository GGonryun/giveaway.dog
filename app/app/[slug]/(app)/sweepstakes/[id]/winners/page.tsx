'use server';

import { SweepstakesWinners } from '@/components/sweepstakes-details/sweepstakes-winners';
import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import getSweepstakePrizes from '@/procedures/sweepstakes/get-sweepstake-prizes';
import getParticipatingUsers from '@/procedures/users/get-participating-users';
import React, { Suspense } from 'react';

interface SweepstakesDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function Page({ params }: SweepstakesDetailPageProps) {
  const { slug, id } = await params;

  return (
    <Suspense fallback={<div>Loading winners...</div>}>
      <Wrapper slug={slug} sweepstakesId={id} />
    </Suspense>
  );
}

const Wrapper: React.FC<{ slug: string; sweepstakesId: string }> = async (
  props
) => {
  const result = await getParticipantSweepstake(props);
  const prizes = await getSweepstakePrizes(props);
  const participants = await getParticipatingUsers({
    slug: props.slug,
    sweepstakesId: props.sweepstakesId
  });

  if (!result.ok) {
    return <div>Failed to load sweepstakes winners: {result.data.message}</div>;
  }

  if (!prizes.ok) {
    return <div>Failed to load sweepstakes prizes: {prizes.data.message}</div>;
  }

  if (!participants.ok) {
    return <div>Failed to load participants: {participants.data.message}</div>;
  }

  return (
    <SweepstakesWinners
      prizes={prizes.data}
      participants={participants.data.users}
      sweepstakesId={props.sweepstakesId}
      slug={props.slug}
    />
  );
};
