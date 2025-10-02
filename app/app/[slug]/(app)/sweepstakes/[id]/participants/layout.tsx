'use server';

import { SweepstakesParticipants } from '@/components/sweepstakes-details/sweepstakes-participants';
import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import getParticipatingUsers from '@/procedures/users/get-participating-users';

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
      <Suspense fallback={<div>Loading users...</div>}>
        <Wrapper {...props} />
      </Suspense>
    </div>
  );
}

const Wrapper: React.FC<Params> = async ({ slug, id }) => {
  const result = await getParticipantSweepstake({ id });
  const participants = await getParticipatingUsers({
    slug,
    sweepstakesId: id,
    // TODO: implement from URL query params
    search: '',
    page: 1,
    sortField: 'lastEntryAt',
    sortDirection: 'desc',
    status: 'all',
    dateRange: 'all'
  });

  if (!result.ok) {
    return <div>Failed to load sweepstakes info: {result.data.message}</div>;
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
      sweepstakesId={id}
      users={participants.data.users}
    />
  );
};
