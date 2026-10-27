import { SweepstakesEntries } from '@giveaway/sweepstakes-details-entries/sweepstakes-entries';
import { SweepstakesEntriesSkeleton } from '@giveaway/sweepstakes-details-entries/sweepstakes-entries-skeleton';
import getSweepstakeEntries from '@giveaway/sweepstakes-insights-server/get-sweepstake-entries';
import getSweepstakesStatus from '@giveaway/sweepstakes-editor-server/get-sweepstakes-status';
import { EDITABLE_DERIVED_STATUS } from '@giveaway/sweepstakes-model/sweepstakes';
import { Suspense } from 'react';

type Params = { slug: string; id: string };
interface EntriesLayoutProps {
  modal: React.ReactNode;
  params: Promise<Params>;
}

export default async function EntriesLayout({
  params,
  modal
}: EntriesLayoutProps) {
  const props = await params;

  return (
    <div>
      {/* Modal overlays */}
      {modal}

      <Suspense fallback={<SweepstakesEntriesSkeleton />}>
        <Wrapper {...props} />
      </Suspense>
    </div>
  );
}

const Wrapper: React.FC<Params> = async ({ id, slug }) => {
  const entries = await getSweepstakeEntries({ sweepstakesId: id, slug });
  const status = await getSweepstakesStatus({ id });

  if (!entries.ok) {
    return (
      <div>Failed to load sweepstakes entries: {entries.data.message}</div>
    );
  }

  if (!status.ok) {
    return <div>Failed to load sweepstakes status: {status.data.message}</div>;
  }

  return (
    <SweepstakesEntries
      sweepstakesId={id}
      slug={slug}
      entries={entries.data}
      readOnly={!EDITABLE_DERIVED_STATUS[status.data.status]}
    />
  );
};
