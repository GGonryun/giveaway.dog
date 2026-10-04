'use server';

import { Suspense } from 'react';
import getSweepstakesForm from '@giveaway/sweepstakes-editor-server/get-sweepstakes-form';
import { SweepstakesForm } from '@/components/sweepstakes-editor/sweepstakes-form';
import { GiveawayFormSchema } from '@giveaway/sweepstakes-model/schemas';
import { notFound } from 'next/navigation';
import getSweepstakesStatus from '@giveaway/sweepstakes-editor-server/get-sweepstakes-status';
import { EDITABLE_DERIVED_STATUS } from '@giveaway/sweepstakes-model/sweepstakes';
import { SweepstakesPageProps } from '@giveaway/sweepstakes-model/pages';
import { getTeamIntegrations } from '@giveaway/integration-server/get-team-integrations';
import { getPublishedSweepstakes } from '@giveaway/sweepstakes-editor-server/get-published-sweepstakes';

export const SweepstakeFormPage = async ({
  params
}: {
  params: Promise<SweepstakesPageProps>;
}) => {
  const { id, slug } = await params;
  const [form, info, integrations, completed] = await Promise.all([
    getSweepstakesForm({ id }),
    getSweepstakesStatus({ id }),
    getTeamIntegrations({ slug }),
    getPublishedSweepstakes({ slug }) // new line to get maxLoyalty
  ]);

  if (!form.ok) {
    if (form.data.code === 'NOT_FOUND') notFound();
    return <div>Failed to load sweepstakes form: {form.data.code}</div>;
  }

  if (!info.ok) {
    if (info.data.code === 'NOT_FOUND') notFound();
    return <div>Failed to load sweepstakes info: {info.data.code}</div>;
  }

  if (!integrations.ok) {
    return <div>Failed to load integrations: {integrations.data.code}</div>;
  }

  const isEditable = EDITABLE_DERIVED_STATUS[info.data.status];
  if (!isEditable) {
    return (
      <div>Sweepstakes with status "{info.data.status}" cannot be edited.</div>
    );
  }

  if (!completed.ok) {
    return (
      <div>
        Failed to load completed sweepstakes count: {completed.data.code}
      </div>
    );
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
        integrations={integrations.data}
        maxLoyalty={completed.data.count}
      />
    </Suspense>
  );
};
