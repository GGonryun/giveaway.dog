'use server';

import { SweepstakesForm } from '@/components/sweepstakes-editor/sweepstakes-form';
import { MockTeamProvider } from '@/components/demo/mock-team-provider';
import { SAMPLE_SWEEPSTAKES_DATA } from '@/components/demo/sample-sweepstakes-data';
import { Suspense } from 'react';
import { PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY } from '@/schemas/feature-flags';

export default async function Page() {
  return (
    <Suspense>
      <MockTeamProvider>
        <SweepstakesForm
          sweepstakes={SAMPLE_SWEEPSTAKES_DATA}
          status="DRAFT"
          validateId={false}
          isDemo={true}
          featureFlags={[PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY]}
        />
      </MockTeamProvider>
    </Suspense>
  );
}
