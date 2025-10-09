import { SweepstakesForm } from '@/components/sweepstakes-editor/sweepstakes-form';
import { MockTeamProvider } from '@/components/demo/mock-team-provider';
import { SAMPLE_SWEEPSTAKES_DATA } from '@/components/demo/sample-sweepstakes-data';

export default async function Page() {
  return (
    <MockTeamProvider>
      <SweepstakesForm
        sweepstakes={SAMPLE_SWEEPSTAKES_DATA}
        status="DRAFT"
        validateId={false}
        isDemo={true}
      />
    </MockTeamProvider>
  );
}
