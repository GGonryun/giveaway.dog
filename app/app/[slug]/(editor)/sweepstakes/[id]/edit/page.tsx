import { Suspense } from 'react';
import getSweepstakesForm from '@/procedures/sweepstakes/get-sweepstakes-form';
import { GiveawayForm } from '@/components/sweepstakes-editor/create-giveaway';

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sweepstakes = await getSweepstakesForm({ id });

  if (!sweepstakes.ok) {
    return <div>Unexpected Error...</div>;
  }

  console.log('sweepstakes', sweepstakes);
  return (
    <Suspense>
      <GiveawayForm giveaway={sweepstakes.data} />
    </Suspense>
  );
}
