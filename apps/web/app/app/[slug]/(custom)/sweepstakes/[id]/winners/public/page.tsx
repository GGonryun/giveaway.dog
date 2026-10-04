import type { Metadata } from 'next';
import { PublicWinnerDraw } from '@giveaway/sweepstakes-details-winners/public-winner-draw';
import { getSweepstakesParticipants } from '@giveaway/participant-server/get-sweepstakes-participants';
import getParticipantSweepstake from '@giveaway/participation-server/get-participant-sweepstake';
import getSweepstakePrizes from '@giveaway/sweepstakes-insights-server/get-sweepstake-prizes';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Public Winner Draw | Giveaway.dog',
    description: 'Live winner draw with card animation',
    robots: {
      index: false,
      follow: false
    }
  };
}

type Params = { slug: string; id: string };

interface PageProps {
  params: Promise<Params>;
}

export default async function PublicDrawPage({ params }: PageProps) {
  const { id, slug } = await params;

  const result = await getParticipantSweepstake({ sweepstakesId: id });
  const prizes = await getSweepstakePrizes({ sweepstakesId: id, slug });
  const participants = await getSweepstakesParticipants({
    slug,
    sweepstakesId: id
  });

  if (!result.ok) {
    return <div>Failed to load sweepstakes: {result.data.message}</div>;
  }

  if (!prizes.ok) {
    return <div>Failed to load prizes: {prizes.data.message}</div>;
  }

  if (!participants.ok) {
    return <div>Failed to load participants: {participants.data.message}</div>;
  }

  return (
    <PublicWinnerDraw
      sweepstakesName={result.data.sweepstakes.setup.name}
      prizes={prizes.data}
      participants={participants.data.users}
      sweepstakesId={id}
      slug={slug}
      criteria={result.data.sweepstakes.criteria}
    />
  );
}
