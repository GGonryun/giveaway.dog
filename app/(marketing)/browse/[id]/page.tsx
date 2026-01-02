import { SweepstakesParticipationPage } from '@/components/sweepstakes-browse/sweepstakes-participation-page-content';
import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { date } from '@/lib/date';
import { getUserHostRelationship } from '@/procedures/browse/get-user-host-relationship';
import { getOrCreateSweepstakesParticipant } from '@/procedures/browse/get-sweepstake-participant';
import { getSweepstakesPrivacy } from '@/procedures/browse/get-sweepstakes-privacy';
import { Suspense } from 'react';
import { ReferralCodeHandler } from '@/components/sweepstakes-browse/referral-code-handler';
import { getUserReferral } from '@/lib/referrals/procedures/get-user-referral';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getParticipantSweepstake({ sweepstakesId: id });

  if (!result.ok) {
    return {
      title: 'Giveaway Not Found | Giveaway.dog'
    };
  }

  const { sweepstakes, host } = result.data;
  const prizeNames = sweepstakes.prizes.map((p) => p.name).join(', ');
  const endDate = date.format(sweepstakes.timing.endDate);

  return {
    title: `${sweepstakes.setup.name} | Giveaway by ${host.name}`,
    description: `Enter to win ${prizeNames}! Giveaway ends ${endDate}. ${sweepstakes.setup.description?.substring(0, 100) || 'Join now for a chance to win!'}`,
    keywords: [
      'giveaway',
      'contest',
      'win',
      sweepstakes.setup.name,
      ...sweepstakes.prizes.map((p) => p.name)
    ],
    openGraph: {
      title: `${sweepstakes.setup.name} | ${host.name}`,
      description: `Enter to win ${prizeNames}! Ends ${endDate}.`,
      type: 'website',
      url: `https://giveaway.dog/browse/${id}`,
      images: [
        {
          url: sweepstakes.setup.banner,
          width: 1920,
          height: 1080,
          alt: sweepstakes.setup.name
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${sweepstakes.setup.name} | ${host.name}`,
      description: `Enter to win ${prizeNames}! Ends ${endDate}.`,
      images: [sweepstakes.setup.banner]
    }
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  const options = { sweepstakesId: id };

  const [sweepstakes, participant, relationship, privacy, referral] =
    await Promise.all([
      getParticipantSweepstake(options),
      getOrCreateSweepstakesParticipant(options),
      getUserHostRelationship(options),
      getSweepstakesPrivacy(options),
      getUserReferral(options)
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

  return (
    <>
      <Suspense fallback={null}>
        <ReferralCodeHandler />
      </Suspense>
      <SweepstakesParticipationPage
        {...sweepstakes.data}
        referral={referral.data}
        participant={participant.data}
        relationship={relationship.data}
      />
    </>
  );
}
