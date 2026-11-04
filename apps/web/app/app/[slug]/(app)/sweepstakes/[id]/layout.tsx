'use server';

import React from 'react';
import { Outline } from '@giveaway/shell-sidebar/app/outline';
import { EditGiveawayButton } from '@giveaway/sweepstakes-actions-ui/edit-giveaway-button';
import { SweepstakesDetailsTabs } from '@giveaway/sweepstakes-details-shell/sweepstakes-tabs';
import getSweepstakesStatus from '@giveaway/sweepstakes-editor-server/get-sweepstakes-status';
import { EDITABLE_DERIVED_STATUS } from '@giveaway/sweepstakes-model/sweepstakes';
import { SweepstakesPageProps } from '@giveaway/sweepstakes-model/pages';
import getDataRetention from '@giveaway/sweepstakes-editor-server/get-data-retention';
import { DataRetentionNotice } from '@giveaway/sweepstakes-details-shell/data-retention-notice';

interface SweepstakesDetailPageProps {
  params: Promise<SweepstakesPageProps>;
  children: React.ReactNode;
}

export default async function Layout({
  params,
  children
}: SweepstakesDetailPageProps) {
  const { id } = await params;

  const [status, retention] = await Promise.all([
    getSweepstakesStatus({ id }),
    getDataRetention({ id })
  ]);
  if (!status.ok) {
    return <div>Failed to load sweepstakes status: {status.data.code}</div>;
  }

  const isEditable = EDITABLE_DERIVED_STATUS[status.data.status];

  return (
    <Outline
      title="Sweepstakes"
      action={isEditable && <EditGiveawayButton id={id} />}
    >
      {retention.ok && <DataRetentionNotice {...retention.data} />}
      <SweepstakesDetailsTabs id={id}>{children}</SweepstakesDetailsTabs>
    </Outline>
  );
}
