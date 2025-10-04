'use server';

import React from 'react';
import { Outline } from '@/components/app/outline';
import { EditGiveawayButton } from '@/components/sweepstakes/edit-giveaway-button';
import { SweepstakesDetailsTabs } from '@/components/sweepstakes-details/sweepstakes-tabs';
import getSweepstakesStatus from '@/procedures/sweepstakes/get-sweepstakes-status';
import { SweepstakesStatus } from '@prisma/client';

interface SweepstakesDetailPageProps {
  params: Promise<{ id: string; slug: string }>;
  children: React.ReactNode;
}

export default async function Layout({
  params,
  children
}: SweepstakesDetailPageProps) {
  const { id } = await params;

  let status: SweepstakesStatus | null = null;

  try {
    const result = await getSweepstakesStatus({ id });
    if (result.ok) {
      status = result.data.status;
    }
  } catch (error) {
    // If status fetch fails, show edit button by default
    status = null;
  }

  return (
    <Outline
      title="Sweepstakes"
      action={
        status !== SweepstakesStatus.COMPLETED ? (
          <EditGiveawayButton id={id} />
        ) : null
      }
    >
      <SweepstakesDetailsTabs id={id}>{children}</SweepstakesDetailsTabs>
    </Outline>
  );
}
