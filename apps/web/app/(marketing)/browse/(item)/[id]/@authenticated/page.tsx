import { notFound } from 'next/navigation';
import getParticipantSweepstake from '@giveaway/participation-server/get-participant-sweepstake';
import { getOrCreateSweepstakesParticipant } from '@giveaway/participation-server/get-sweepstake-participant';
import { getViewer } from '@giveaway/participation-server/get-viewer';
import { getUserHostRelationship } from '@giveaway/participation-server/get-user-host-relationship';
import { getSweepstakesPrivacy } from '@giveaway/participation-server/get-sweepstakes-privacy';
import { getUserReferral } from '@giveaway/referrals-server/get-user-referral';
import { AuthenticatedSweepstakesContent } from '@giveaway/browse-item/authenticated-sweepstakes-content';
import { Suspense } from 'react';
import { ReferralCodeHandler } from '@giveaway/browse-item/referral-code-handler';
import { getSweepstakesAllocations } from '@giveaway/allocation-server/get-sweepstakes-allocations';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AuthenticatedPage({ params }: PageProps) {
  const { id } = await params;
  const options = { sweepstakesId: id };

  const pending = Promise.all([
    getOrCreateSweepstakesParticipant(options),
    getUserHostRelationship(options),
    getSweepstakesPrivacy(options)
  ]);
  const sweepstakes = await getParticipantSweepstake(options);

  if (!sweepstakes.ok) {
    console.warn('Sweepstake not found:', sweepstakes.data.message);
    notFound();
  }

  const resolved = { sweepstakesId: sweepstakes.data.sweepstakes.id };
  const [[participant, relationship, privacy], referral, allocations] =
    await Promise.all([
      pending,
      getUserReferral(resolved),
      getSweepstakesAllocations(resolved)
    ]);

  if (!relationship.ok) {
    console.warn('Host relationship fetch error:', relationship.data?.message);
    notFound();
  }

  if (!participant.ok) {
    console.warn('Participant fetch error:', participant.data?.message);
    notFound();
  }

  if (!privacy.ok) {
    console.warn('Sweepstake privacy fetch error:', privacy.data?.message);
    notFound();
  }

  if (!privacy.data) {
    console.warn('Sweepstake is not visible:', privacy.data);
    notFound();
  }

  if (!referral.ok) {
    console.warn('User referral fetch error:', referral.data?.message);
    notFound();
  }

  if (!allocations.ok) {
    console.warn(
      'Sweepstakes allocations fetch error:',
      allocations.data?.message
    );
    notFound();
  }

  const viewer = participant.data ? undefined : await getViewer();

  if (viewer && !viewer.ok) {
    console.warn('Viewer fetch error:', viewer.data?.message);
    notFound();
  }

  return (
    <>
      <Suspense fallback={null}>
        <ReferralCodeHandler />
      </Suspense>
      <AuthenticatedSweepstakesContent
        {...sweepstakes.data}
        participant={participant.data}
        viewer={viewer?.data}
        relationship={relationship.data}
        referral={referral.data}
        allocations={allocations.data}
      />
    </>
  );
}
