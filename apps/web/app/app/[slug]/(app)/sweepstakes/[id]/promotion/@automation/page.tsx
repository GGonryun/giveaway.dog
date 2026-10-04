import { AutomationCard } from '@/lib/automation/components/automation-card';
import { AutomationCardSkeleton } from '@/lib/automation/components/automation-card-skeleton';
import { getAutomatedPostJobs } from '@/lib/automation/procedures/get-automated-post-jobs';
import { getTeamIntegrations } from '@giveaway/integration-server/get-team-integrations';
import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import { SweepstakesPageProps } from '@giveaway/sweepstakes-model/pages';
import React, { Suspense } from 'react';

interface PageProps {
  params: Promise<SweepstakesPageProps>;
}

export default async function Page({ params }: PageProps) {
  const awaited = await params;

  return (
    <Suspense fallback={<AutomationCardSkeleton />}>
      <Wrapper {...awaited} />
    </Suspense>
  );
}

const Wrapper: React.FC<SweepstakesPageProps> = async ({
  id: sweepstakesId,
  slug
}) => {
  const sweepstake = await getParticipantSweepstake({ sweepstakesId });
  const integrations = await getTeamIntegrations({ slug });
  const jobs = await getAutomatedPostJobs({ sweepstakesId });

  if (!sweepstake.ok) {
    return <div>Failed to load sweepstakes: {sweepstake.data.message}</div>;
  }
  if (!integrations.ok) {
    return <div>Failed to load integrations: {integrations.data.message}</div>;
  }
  if (!jobs.ok) {
    return <div>Failed to load jobs: {jobs.data.message}</div>;
  }
  return (
    <AutomationCard
      {...sweepstake.data}
      integrations={integrations.data}
      slug={slug}
      jobs={jobs.data}
    />
  );
};
