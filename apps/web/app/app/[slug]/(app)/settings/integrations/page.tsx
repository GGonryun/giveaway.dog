'use server';

import { Suspense } from 'react';
import { TeamPageProps } from '@/schemas/pages';
import { getTeamIntegrations } from '@giveaway/integration-server/get-team-integrations';
import { TeamIntegrationSettings } from '@/lib/settings/components/integrations';

export default async function IntegrationsPage({
  params
}: {
  params: Promise<TeamPageProps>;
}) {
  const { slug } = await params;

  return (
    <Suspense fallback={<div>Loading integrations...</div>}>
      <Wrapper slug={slug} />
    </Suspense>
  );
}

const Wrapper: React.FC<{ slug: string }> = async ({ slug }) => {
  const integrations = await getTeamIntegrations({
    slug
  });

  if (!integrations.ok) {
    return <div>Failed to load integrations: {integrations.data.message}</div>;
  }

  return <TeamIntegrationSettings integrations={integrations.data} />;
};
