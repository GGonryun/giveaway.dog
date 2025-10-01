import { SweepstakesEntries } from '@/components/sweepstakes-details/sweepstakes-entries';
import getSweepstakeEntries from '@/procedures/sweepstakes/get-sweepstake-entries';
import { Suspense } from 'react';

interface EntriesLayoutProps {
  modal: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function EntriesLayout({
  params,
  modal
}: EntriesLayoutProps) {
  const { id } = await params;

  return (
    <div>
      {/* Modal overlays */}
      {modal}

      <Suspense fallback={<div>Loading entries...</div>}>
        <Wrapper id={id} />
      </Suspense>
    </div>
  );
}

const Wrapper: React.FC<{ id: string }> = async ({ id }) => {
  const entries = await getSweepstakeEntries({ id });
  console.log('Entries fetched');

  if (!entries.ok) {
    return (
      <div>Failed to load sweepstakes entries: {entries.data.message}</div>
    );
  }

  return <SweepstakesEntries sweepstakesId={id} entries={entries.data} />;
};
