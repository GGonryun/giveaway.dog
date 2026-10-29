import { SweepstakesForm } from '@giveaway/sweepstakes-editor/sweepstakes-form';
import { MockTeamProvider } from '@giveaway/team-context/mock-team-provider';
import { SAMPLE_SWEEPSTAKES_DATA } from '@giveaway/sweepstakes-demo/sample-sweepstakes-data';
import { Suspense } from 'react';
import { pageMetadata } from '@giveaway/marketing-model/page-metadata';

export const metadata = pageMetadata({
  title: 'Giveaway Editor Demo | Giveaway.dog',
  description:
    'Try the Giveaway.dog editor with a sample giveaway: add entry methods and prizes, and preview the page your entrants see.'
});

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
