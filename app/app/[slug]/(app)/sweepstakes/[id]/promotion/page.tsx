'use server';

import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import React, { Suspense } from 'react';
import { SweepstakesPromotion } from '@/components/sweepstakes-details/sweepstakes-promotion';
import { SweepstakesPromotionSkeleton } from '@/components/sweepstakes-details/sweepstakes-promotion-skeleton';
import type { Metadata } from 'next';

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

interface SweepstakesDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: SweepstakesDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<SweepstakesPromotionSkeleton />}>
      <Wrapper id={id} />
    </Suspense>
  );
}

const Wrapper: React.FC<{ id: string }> = async ({ id }) => {
  const result = await getParticipantSweepstake({ sweepstakesId: id });

  if (!result.ok) {
    return (
      <div>Failed to load sweepstakes promotion: {result.data.message}</div>
    );
  }
  return <SweepstakesPromotion {...result.data} />;
};
