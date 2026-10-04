'use server';

import { SweepstakesPreview } from '@/components/sweepstakes-details/sweepstakes-preview';
import { SweepstakesLoadingSkeleton } from '@giveaway/sweepstakes-details-shell/sweepstakes-loading-skeleton';
import getParticipantSweepstake from '@giveaway/participation-server/get-participant-sweepstake';
import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { SweepstakesPageProps } from '@giveaway/sweepstakes-model/pages';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Preview | Giveaway.dog',
    description: 'Preview your sweepstakes',
    robots: {
      index: false,
      follow: false
    }
  };
}

interface SweepstakesDetailPageProps {
  params: Promise<SweepstakesPageProps>;
}

export default async function Page({ params }: SweepstakesDetailPageProps) {
  return (
    <Suspense fallback={<SweepstakesLoadingSkeleton />}>
      <Wrapper params={params} />
    </Suspense>
  );
}

const Wrapper: React.FC<{ params: Promise<SweepstakesPageProps> }> = async ({
  params
}) => {
  const { id, slug } = await params;
  const result = await getParticipantSweepstake({ sweepstakesId: id });

  if (!result.ok) {
    return <div>Failed to load sweepstakes details: {result.data.message}</div>;
  }
  return <SweepstakesPreview {...result.data} />;
};
