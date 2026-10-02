'use server';

import { SweepstakesParticipants } from '@/components/sweepstakes-details/sweepstakes-participants';
import { SweepstakesParticipantsSkeleton } from '@/components/sweepstakes-details/sweepstakes-participants-skeleton';
import { getSweepstakesParticipants } from '@/lib/participant/procedures/get-sweepstakes-participants';
import { getSweepstakesTasks } from '@/procedures/browse/get-sweepstake-tasks';

import React, { Suspense } from 'react';

type Params = { slug: string; id: string };
interface SweepstakesDetailPageProps {
  modal: React.ReactNode;
  params: Promise<Params>;
}

export default async function Layout({
  modal,
  params
}: SweepstakesDetailPageProps) {
  const props = await params;

  return (
    <div>
      {/* Modal overlays */}
      {modal}
      <Suspense fallback={<SweepstakesParticipantsSkeleton />}>
        <Wrapper {...props} />
      </Suspense>
    </div>
  );
}

const Wrapper: React.FC<Params> = async ({ slug, id: sweepstakesId }) => {
  const tasks = await getSweepstakesTasks({ sweepstakesId });
  const participants = await getSweepstakesParticipants({
    slug,
    sweepstakesId
  });

  if (!tasks.ok) {
    return <div>Failed to load sweepstakes info: {tasks.data.message}</div>;
  }
  if (!participants.ok) {
    return (
      <div>
        Failed to load sweepstakes participants: {participants.data.message}
      </div>
    );
  }
  return (
    <SweepstakesParticipants
      slug={slug}
      sweepstakesId={sweepstakesId}
      totalTasks={tasks.data.length}
      participants={participants.data.users}
    />
  );
};
