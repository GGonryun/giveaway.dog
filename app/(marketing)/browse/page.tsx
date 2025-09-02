import { SweepstakesPageContent } from '@/components/sweepstakes-browse/page';
import getPublicSweepstakesList from '@/procedures/browse/get-public-sweepstakes-list';

export const revalidate = 60; // 1 minutes in seconds, must be statically analyzable

export default async function Page() {
  const sweepstakes = await getPublicSweepstakesList();
  if (!sweepstakes.ok)
    return (
      <div>
        [ERROR-{sweepstakes.data.code}]: {sweepstakes.data.message}
      </div>
    );

  return <SweepstakesPageContent sweepstakes={sweepstakes.data} />;
}
