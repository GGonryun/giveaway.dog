import { Suspense } from 'react';
import { SweepstakesTabsWrapper } from './components/sweepstakes-tabs';
import { Outline } from '@/components/app/outline';
import { EditGiveawayButton } from '@/components/sweepstakes/edit-giveaway-button';
import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';

interface SweepstakesDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SweepstakesDetailPage({
  params
}: SweepstakesDetailPageProps) {
  const { id: sweepstakesId } = await params;
  const result = await getParticipantSweepstake({ id: sweepstakesId });

  if (!result.ok) {
    return <div>Failed to load sweepstakes details: {result.data.message}</div>;
  }

  return (
    <Outline
      title={result.data.sweepstakes.setup.name}
      className="space-y-4 pt-0 sm:pt-8"
      action={<EditGiveawayButton sweepstakesId={sweepstakesId} />}
    >
      <div className="space-y-4">
        <Suspense>
          <SweepstakesTabsWrapper
            data={result.data}
            sweepstakesId={sweepstakesId}
          />
        </Suspense>
      </div>
    </Outline>
  );
}
