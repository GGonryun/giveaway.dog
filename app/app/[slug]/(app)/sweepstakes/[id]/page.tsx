import getSweepstakesDetails from '@/procedures/sweepstakes/get-sweepstakes-details';

import { Suspense } from 'react';
import { SweepstakesTabsWrapper } from './components/sweepstakes-tabs';
import { Outline } from '@/components/app/outline';
import { EditGiveawayButton } from '@/components/sweepstakes/edit-giveaway-button';

interface SweepstakesDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SweepstakesDetailPage({
  params
}: SweepstakesDetailPageProps) {
  const { id: sweepstakesId } = await params;
  const details = await getSweepstakesDetails({ id: sweepstakesId });

  if (!details.ok) {
    return (
      <div>Failed to load sweepstakes details: {details.data.message}</div>
    );
  }

  return (
    <Outline
      title={details.data.name}
      className="space-y-4 pt-0 sm:pt-8"
      action={<EditGiveawayButton />}
    >
      <div className="space-y-4">
        <Suspense>
          <SweepstakesTabsWrapper sweepstakes={details.data} />
        </Suspense>
      </div>
    </Outline>
  );
}
