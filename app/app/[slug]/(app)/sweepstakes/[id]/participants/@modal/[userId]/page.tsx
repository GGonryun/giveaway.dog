'use server';

import {
  ParticipatingUserSheet,
  ParticipatingUserSheetContent
} from '@/components/sweepstakes-details/user-detail-sheet';
import getParticipatingUser from '@/procedures/users/get-participating-user';
import { Suspense } from 'react';

const Page: React.FC<{
  params: Promise<{ slug: string; id: string; userId: string }>;
}> = async ({ params }) => {
  const { slug, id, userId } = await params;

  if (!id || !userId) {
    return null;
  }

  return (
    <ParticipatingUserSheet sweepstakesId={id} slug={slug} root="participants">
      <Suspense fallback={<div>Loading...</div>}>
        <Wrapper sweepstakesId={id} userId={userId} />
      </Suspense>
    </ParticipatingUserSheet>
  );
};

const Wrapper: React.FC<{ sweepstakesId: string; userId: string }> = async ({
  sweepstakesId,
  userId
}) => {
  const details = await getParticipatingUser({
    sweepstakesId,
    userId
  });

  if (!details.ok) {
    return <div>Failed to load sweepstakes entry: {details.data.message}</div>;
  }

  return <ParticipatingUserSheetContent user={details.data} />;
};

export default Page;
