'use server';

import { SweepstakesPreview } from '@/components/sweepstakes-details/sweepstakes-preview';
import { SweepstakesLoadingSkeleton } from '@/components/sweepstakes-details/sweepstakes-loading-skeleton';
import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import getTeamFeatureFlags from '@/procedures/teams/get-team-feature-flags';
import { SweepstakesPageProps } from '@/schemas/pages';

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
  const featureFlagsResult = await getTeamFeatureFlags({ slug });

  const featureFlags = featureFlagsResult.ok ? featureFlagsResult.data : [];

  if (!result.ok) {
    return <div>Failed to load sweepstakes details: {result.data.message}</div>;
  }
  return (
    <SweepstakesPreview {...result.data} teamFeatureFlags={featureFlags} />
  );
};
