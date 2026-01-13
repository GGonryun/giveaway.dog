import { notFound } from 'next/navigation';
import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import { getOrCreateSweepstakesParticipant } from '@/procedures/browse/get-sweepstake-participant';
import { getUserHostRelationship } from '@/procedures/browse/get-user-host-relationship';
import { getSweepstakesPrivacy } from '@/procedures/browse/get-sweepstakes-privacy';
import { getUserReferral } from '@/lib/referrals/procedures/get-user-referral';
import { AuthenticatedSweepstakesContent } from '@/components/sweepstakes-browse/authenticated-sweepstakes-content';
import { Suspense } from 'react';
import { ReferralCodeHandler } from '@/components/sweepstakes-browse/referral-code-handler';
import { getAllocatedPrize } from '@/lib/allocation/procedures/get-allocated-prize';

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
    allocation
  ] = await Promise.all([
    getParticipantSweepstake(options),
    getOrCreateSweepstakesParticipant(options),
    getUserHostRelationship(options),
    getSweepstakesPrivacy(options),
    getUserReferral(options),
    getAllocatedPrize(options)
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

  if (!allocation.ok) {
    console.warn('User allocation fetch error:', allocation.data?.message);
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
        allocation={allocation.data}
      />
    </>
  );
}
