import { SweepstakesWinners } from '@/components/sweepstakes-details/sweepstakes-winners';
import { SweepstakesWinnersSkeleton } from '@/components/sweepstakes-details/sweepstakes-winners-skeleton';
import { getSweepstakesParticipants } from '@/lib/participant/procedures/get-sweepstakes-participants';
import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import getSweepstakePrizes from '@/procedures/sweepstakes/get-sweepstake-prizes';

import { Suspense } from 'react';

type Params = { slug: string; id: string };
interface WinnersLayoutProps {
  modal: React.ReactNode;
  params: Promise<Params>;
}

export default async function WinnersLayout({
  params,
  modal
}: WinnersLayoutProps) {
  const props = await params;

  return (
    <div>
      {/* Modal overlays */}
      {modal}

      <Suspense fallback={<SweepstakesWinnersSkeleton />}>
        <Wrapper {...props} />
      </Suspense>
    </div>
  );
}

const Wrapper: React.FC<Params> = async ({ id, slug }) => {
  const result = await getParticipantSweepstake({ sweepstakesId: id });
  const prizes = await getSweepstakePrizes({ sweepstakesId: id, slug });
  const participants = await getSweepstakesParticipants({
    slug,
    sweepstakesId: id
  });

  if (!result.ok) {
    return <div>Failed to load sweepstakes winners: {result.data.message}</div>;
  }

  if (!prizes.ok) {
    return <div>Failed to load sweepstakes prizes: {prizes.data.message}</div>;
  }

  if (!participants.ok) {
    return <div>Failed to load participants: {participants.data.message}</div>;
  }

  return (
    <SweepstakesWinners
      prizes={prizes.data}
      participants={participants.data.users}
      sweepstakesId={id}
      slug={slug}
      status={result.data.sweepstakes.status}
      endDate={result.data.sweepstakes.timing.endDate}
      criteria={result.data.sweepstakes.criteria}
    />
  );
};
