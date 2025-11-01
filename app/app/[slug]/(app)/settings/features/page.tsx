'use server';

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { TeamPageProps } from '@/schemas/pages';
import { TeamFeatures } from '@/lib/settings/components/team-features';
import getTeamFeatureFlags from '@/procedures/teams/get-team-feature-flags';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Team Features | Giveaway.dog',
    description: 'View your team available features and settings',
    robots: {
      index: false,
      follow: false
    }
  };
}

interface PageProps {
  params: Promise<TeamPageProps>;
}

export default async function Page({ params }: PageProps) {
  return (
    <Suspense fallback={<div>Loading features page...</div>}>
      <Wrapper params={params} />
    </Suspense>
  );
}

const Wrapper: React.FC<{
  params: Promise<TeamPageProps>;
}> = async ({ params }) => {
  const { slug } = await params;

  const flags = await getTeamFeatureFlags({ slug });

  if (!flags.ok) {
    return <div>Failed to load feature flags: {flags.data.message}</div>;
  }

  return <TeamFeatures teamFeatureFlags={flags.data} />;
};
