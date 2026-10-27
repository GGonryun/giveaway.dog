'use server';

import { SweepstakesParticipants } from '@giveaway/sweepstakes-details-participants/sweepstakes-participants';
import { SweepstakesParticipantsSkeleton } from '@giveaway/sweepstakes-details-participants/sweepstakes-participants-skeleton';
import { getSweepstakesParticipants } from '@giveaway/participant-server/get-sweepstakes-participants';
import { getSweepstakesTasks } from '@giveaway/participation-server/get-sweepstake-tasks';
import getSweepstakesStatus from '@giveaway/sweepstakes-editor-server/get-sweepstakes-status';
import { EDITABLE_DERIVED_STATUS } from '@giveaway/sweepstakes-model/sweepstakes';

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
  const status = await getSweepstakesStatus({ id: sweepstakesId });

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
  if (!status.ok) {
    return <div>Failed to load sweepstakes status: {status.data.message}</div>;
  }
  return (
    <SweepstakesParticipants
      slug={slug}
      sweepstakesId={sweepstakesId}
      totalTasks={tasks.data.length}
      participants={participants.data.users}
      readOnly={!EDITABLE_DERIVED_STATUS[status.data.status]}
    />
  );
};
