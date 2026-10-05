'use server';

import {
  ParticipatingUserSheet,
  UserParticipantSheetContent
} from '@giveaway/sweepstakes-details-participants/user-participant-detail-sheet';
import { getSweepstakesParticipant } from '@giveaway/participant-server/get-sweepstake-participant';
import { getSweepstakesFormFields } from '@giveaway/participation-server/get-sweepstake-form-field';
import { getSweepstakesTasks } from '@giveaway/participation-server/get-sweepstake-tasks';

import { Suspense } from 'react';

const Page: React.FC<{
  params: Promise<{ slug: string; id: string; userId: string }>;
}> = async ({ params }) => {
  const { slug, id, userId } = await params;

  if (!id || !userId || !slug) {
    return null;
  }

  return (
    <ParticipatingUserSheet sweepstakesId={id} slug={slug} root="participants">
      <Suspense fallback={<div>Loading...</div>}>
        <Wrapper sweepstakesId={id} userId={userId} slug={slug} />
      </Suspense>
    </ParticipatingUserSheet>
  );
};

const Wrapper: React.FC<{
  slug: string;
  sweepstakesId: string;
  userId: string;
}> = async ({ slug, sweepstakesId, userId }) => {
  const tasks = await getSweepstakesTasks({ sweepstakesId });
  const fields = await getSweepstakesFormFields({ sweepstakesId });
  const details = await getSweepstakesParticipant({
    slug,
    sweepstakesId,
    userId
  });

  if (!details.ok) {
    return <div>Failed to load sweepstakes entry: {details.data.message}</div>;
  }

  if (!tasks.ok) {
    return <div>Failed to load sweepstakes tasks: {tasks.data.message}</div>;
  }

  if (!fields.ok) {
    return (
      <div>Failed to load sweepstakes form fields: {fields.data.message}</div>
    );
  }

  return (
    <UserParticipantSheetContent
      participant={details.data}
      totalTasks={tasks.data.length}
      fields={fields.data}
    />
  );
};

export default Page;
