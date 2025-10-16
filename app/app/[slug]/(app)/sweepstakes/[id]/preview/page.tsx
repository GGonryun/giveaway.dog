'use server';

import { SweepstakesPreview } from '@/components/sweepstakes-details/sweepstakes-preview';
import { SweepstakesLoadingSkeleton } from '@/components/sweepstakes-details/sweepstakes-loading-skeleton';
import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import getUserFeatureFlags from '@/procedures/users/get-user-feature-flags';
import React, { Suspense } from 'react';
import type { Metadata } from 'next';

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
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: SweepstakesDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<SweepstakesLoadingSkeleton />}>
      <Wrapper id={id} />
    </Suspense>
  );
}

const Wrapper: React.FC<{ id: string }> = async ({ id }) => {
  const result = await getParticipantSweepstake({ sweepstakesId: id });
  const featureFlagsResult = await getUserFeatureFlags();

  const featureFlags = featureFlagsResult.ok ? featureFlagsResult.data : [];

  if (!result.ok) {
    return <div>Failed to load sweepstakes details: {result.data.message}</div>;
  }
  return (
    <SweepstakesPreview {...result.data} userFeatureFlags={featureFlags} />
  );
};
