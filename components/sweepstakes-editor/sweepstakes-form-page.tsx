'use server';

import { Suspense } from 'react';
import getSweepstakesForm from '@/procedures/sweepstakes/get-sweepstakes-form';
import { SweepstakesForm } from '@/components/sweepstakes-editor/sweepstakes-form';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { notFound } from 'next/navigation';
import getSweepstakesStatus from '@/procedures/sweepstakes/get-sweepstakes-status';

export const SweepstakeFormPage = async ({
  params
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const [form, info] = await Promise.all([
    getSweepstakesForm({ id }),
    getSweepstakesStatus({ id })
  ]);

  if (!form.ok) {
    if (form.data.code === 'NOT_FOUND') notFound();
    return <div>Failed to load sweepstakes form: {form.data.code}</div>;
  }

  if (!info.ok) {
    if (info.data.code === 'NOT_FOUND') notFound();
    return <div>Failed to load sweepstakes info: {info.data.code}</div>;
  }

  return (
    <Suspense>
      {/* 
      WARNING: It would be nice to remove the explicit type assertion here but we want to allow
      users to save drafts with potentially incomplete or broken data, this allows the
      form to properly render errors when they come back to edit or make changes
       */}
      <SweepstakesForm
        sweepstakes={form.data as GiveawayFormSchema}
        status={info.data.status}
      />
    </Suspense>
  );
};
