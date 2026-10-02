import { notFound } from 'next/navigation';
import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import { getSweepstakesPrivacy } from '@/procedures/browse/get-sweepstakes-privacy';
import { PublicSweepstakesContent } from '@/components/sweepstakes-browse/public-sweepstakes-content';
import { Suspense } from 'react';
import { ReferralCodeHandler } from '@/components/sweepstakes-browse/referral-code-handler';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AnonymousPage({ params }: PageProps) {
  const { id } = await params;
  const options = { sweepstakesId: id };

  // Only fetch public data
  const [sweepstakes, privacy] = await Promise.all([
    getParticipantSweepstake(options),
    getSweepstakesPrivacy(options)
  ]);

  if (!sweepstakes.ok) {
    console.warn('Sweepstake not found:', sweepstakes.data.message);
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

  return (
    <>
      <Suspense fallback={null}>
        <ReferralCodeHandler />
      </Suspense>
      <PublicSweepstakesContent {...sweepstakes.data} />
    </>
  );
}
