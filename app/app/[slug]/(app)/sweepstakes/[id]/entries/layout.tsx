import { SweepstakesEntries } from '@/components/sweepstakes-details/sweepstakes-entries';
import { SweepstakesEntriesSkeleton } from '@/components/sweepstakes-details/sweepstakes-entries-skeleton';
import getSweepstakeEntries from '@/procedures/sweepstakes/get-sweepstake-entries';
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

  if (!entries.ok) {
    return (
      <div>Failed to load sweepstakes entries: {entries.data.message}</div>
    );
  }

  return (
    <SweepstakesEntries sweepstakesId={id} slug={slug} entries={entries.data} />
  );
};
