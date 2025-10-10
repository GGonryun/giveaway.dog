'use server';

import React from 'react';
import { Outline } from '@/components/app/outline';
import { EditGiveawayButton } from '@/components/sweepstakes/edit-giveaway-button';
import { SweepstakesDetailsTabs } from '@/components/sweepstakes-details/sweepstakes-tabs';

interface SweepstakesDetailPageProps {
  params: Promise<{ id: string; slug: string }>;
  children: React.ReactNode;
}

export default async function Layout({
  params,
  children
}: SweepstakesDetailPageProps) {
  const { id } = await params;

  return (
    <Outline title="Sweepstakes" action={<EditGiveawayButton id={id} />}>
      <SweepstakesDetailsTabs id={id}>{children}</SweepstakesDetailsTabs>
    </Outline>
  );
}
