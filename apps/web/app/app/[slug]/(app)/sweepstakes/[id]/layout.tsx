'use server';

import React from 'react';
import { Outline } from '@/components/app/outline';
import { EditGiveawayButton } from '@/components/sweepstakes/edit-giveaway-button';
import { SweepstakesDetailsTabs } from '@/components/sweepstakes-details/sweepstakes-tabs';
import getSweepstakesStatus from '@/procedures/sweepstakes/get-sweepstakes-status';
import { EDITABLE_DERIVED_STATUS } from '@giveaway/sweepstakes-model/sweepstakes';
import { SweepstakesPageProps } from '@giveaway/sweepstakes-model/pages';

interface SweepstakesDetailPageProps {
  params: Promise<SweepstakesPageProps>;
  children: React.ReactNode;
}

export default async function Layout({
  params,
  children
}: SweepstakesDetailPageProps) {
  const { id } = await params;

  const status = await getSweepstakesStatus({ id });
  if (!status.ok) {
    return <div>Failed to load sweepstakes status: {status.data.code}</div>;
  }

  const isEditable = EDITABLE_DERIVED_STATUS[status.data.status];

  return (
    <Outline
      title="Sweepstakes"
      action={isEditable && <EditGiveawayButton id={id} />}
    >
      <SweepstakesDetailsTabs id={id}>{children}</SweepstakesDetailsTabs>
    </Outline>
  );
}
