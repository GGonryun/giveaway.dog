'use server';

import getParticipantSweepstake from '@giveaway/participation-server/get-participant-sweepstake';
import React, { Suspense } from 'react';

import type { Metadata } from 'next';
import { SweepstakesPageProps } from '@giveaway/sweepstakes-model/pages';
import { SweepstakesPromotionPageSkeleton } from '@giveaway/sweepstakes-details-promotion/components/skeleton';
import { SweepstakesPromotionPage } from '@giveaway/sweepstakes-details-promotion/components/page';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Promotion | Giveaway.dog',
    description: 'Promote your sweepstakes',
    robots: {
      index: false,
      follow: false
    }
  };
}

interface PageProps {
  params: Promise<SweepstakesPageProps>;
}

export default async function Page({ params }: PageProps) {
  const { id, slug } = await params;

  return (
    <Suspense fallback={<SweepstakesPromotionPageSkeleton />}>
      <Wrapper id={id} slug={slug} />
    </Suspense>
  );
}

const Wrapper: React.FC<SweepstakesPageProps> = async ({ id, slug }) => {
  const result = await getParticipantSweepstake({ sweepstakesId: id });

  if (!result.ok) {
    return <div>Failed to load sweepstakes: {result.data.message}</div>;
  }

  return <SweepstakesPromotionPage {...result.data} />;
};
