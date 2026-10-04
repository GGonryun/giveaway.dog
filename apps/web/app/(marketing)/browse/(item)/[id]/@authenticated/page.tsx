import { notFound } from 'next/navigation';
import getParticipantSweepstake from '@giveaway/participation-server/get-participant-sweepstake';
import { getOrCreateSweepstakesParticipant } from '@giveaway/participation-server/get-sweepstake-participant';
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

  // Fetch ALL data including user-specific
  const [
    sweepstakes,
    participant,
    relationship,
    privacy,
    referral,
    allocations
  ] = await Promise.all([
    getParticipantSweepstake(options),
    getOrCreateSweepstakesParticipant(options),
    getUserHostRelationship(options),
    getSweepstakesPrivacy(options),
    getUserReferral(options),
    getSweepstakesAllocations(options)
  ]);

  if (!sweepstakes.ok) {
    console.warn('Sweepstake not found:', sweepstakes.data.message);
    notFound();
  }

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

  return (
    <>
      <Suspense fallback={null}>
        <ReferralCodeHandler />
      </Suspense>
      <AuthenticatedSweepstakesContent
        {...sweepstakes.data}
        participant={participant.data}
        relationship={relationship.data}
        referral={referral.data}
        allocations={allocations.data}
      />
    </>
  );
}
