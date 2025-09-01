import { Suspense } from 'react';
import getSweepstakesForm from '@/procedures/sweepstakes/get-sweepstakes-form';
import { GiveawayForm } from '@/components/sweepstakes-editor/giveaway-form';
import { GiveawayFormSchema } from '@/schemas/giveaway';

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

  return (
    <Suspense>
      {/* 
      WARNING: It would be nice to remove the explicit type assertion here but we want to allow
      users to save drafts with potentially incomplete or broken data, this allows the
      form to properly render errors when they come back to edit or make changes
       */}
      <GiveawayForm sweepstakes={sweepstakes.data as GiveawayFormSchema} />
    </Suspense>
  );
}
