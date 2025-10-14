import { SweepstakesParticipationPage } from '@/components/sweepstakes-browse/sweepstakes-participation-page-content';
import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import { notFound } from 'next/navigation';
import getUserSweepstakesParticipation from '@/procedures/browse/get-user-sweepstakes-participation';
import findUser from '@/procedures/user/find-user';
import getAgeVerification from '@/procedures/sweepstakes/get-age-verification';
import { computeState } from '@/lib/sweepstakes';
import { Metadata } from 'next';
import { date } from '@/lib/date';

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

  const result = await getParticipantSweepstake({ sweepstakesId: id });
  const user = await findUser({ self: true });
  const participation = await getUserSweepstakesParticipation({ id });
  const verification = await getAgeVerification({ sweepstakesId: id });

  if (!result.ok) {
    console.warn('Sweepstake not found:', result.data.message);
    notFound();
  }

  if (!user.ok) {
    console.warn('User not found:', user.data?.message);
    notFound();
  }

  if (!participation.ok) {
    console.warn('Participation fetch error:', participation.data?.message);
    notFound();
  }

  if (!verification.ok) {
    console.warn('Age verification fetch error:', verification.data?.message);
    notFound();
  }

  const userProfile = user.data ?? undefined;
  const sweepstakes = result.data.sweepstakes;
  const winners = result.data.winners;
  const ageVerification = verification.data ?? null;

  return (
    <SweepstakesParticipationPage
      {...result.data}
      state={computeState({
        sweepstakes,
        winners,
        userProfile,
        ageVerification
      })}
      userProfile={userProfile}
      userParticipation={participation.data}
    />
  );
}
