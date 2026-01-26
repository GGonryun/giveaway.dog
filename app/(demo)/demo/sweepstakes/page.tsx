'use server';

import { SweepstakesForm } from '@/components/sweepstakes-editor/sweepstakes-form';
import { MockTeamProvider } from '@/components/demo/mock-team-provider';
import { SAMPLE_SWEEPSTAKES_DATA } from '@/components/demo/sample-sweepstakes-data';
import { Suspense } from 'react';

export default async function Page() {
  return (
    <Suspense>
      <MockTeamProvider>
        <SweepstakesForm
          maxLoyalty={10}
          integrations={[]}
          sweepstakes={SAMPLE_SWEEPSTAKES_DATA}
          isDemo={true}
        />
      </MockTeamProvider>
    </Suspense>
  );
}
