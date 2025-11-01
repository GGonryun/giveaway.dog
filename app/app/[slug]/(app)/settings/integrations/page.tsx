'use server';

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { TeamPageProps } from '@/schemas/pages';
import { getTeamIntegrations } from '@/lib/integrations/procedures/get-team-integrations';
import { TeamIntegrationSettings } from '@/lib/settings/components/integrations';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Team Profile | Giveaway.dog',
    description: 'View your team profile settings and details',
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
    <Suspense fallback={<div>Loading integrations page...</div>}>
      <Wrapper params={params} />
    </Suspense>
  );
}

const Wrapper: React.FC<{
  params: Promise<TeamPageProps>;
}> = async ({ params }) => {
  const { slug } = await params;

  const integrations = await getTeamIntegrations({ slug });

  if (!integrations.ok) {
    return <div>Failed to load integrations: {integrations.data.message}</div>;
  }

  return <TeamIntegrationSettings integrations={integrations.data} />;
};
