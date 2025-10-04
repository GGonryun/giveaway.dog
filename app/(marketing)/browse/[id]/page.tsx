import { SweepstakesParticipationPage } from '@/components/sweepstakes-browse/sweepstakes-participation-page-content';
import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import { notFound } from 'next/navigation';
import getUserSweepstakesParticipation from '@/procedures/browse/get-user-sweepstakes-participation';
import findUser from '@/procedures/user/find-user';
import getAgeVerification from '@/procedures/sweepstakes/get-age-verification';
import { computeState } from '@/lib/sweepstakes';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  const result = await getParticipantSweepstake({ sweepstakesId: id });
  const user = await findUser();
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
  const ageVerification = verification.data ?? null;

  return (
    <SweepstakesParticipationPage
      {...result.data}
      state={computeState({ sweepstakes, userProfile, ageVerification })}
      userProfile={userProfile}
      userParticipation={participation.data}
    />
  );
}
