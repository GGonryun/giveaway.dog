import { ParticipationHistoryTable } from '@giveaway/account-history/participation-history-table';
import { ParticipationHistorySkeleton } from '@giveaway/account-history/participation-history-skeleton';
import getParticipationHistory from '@giveaway/participation-history-server/get-participation-history';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'History | Giveaway.dog',
  description: 'View your account history',
  robots: {
    index: false,
    follow: false
  }
};

export default async function Page() {
  return (
    <Suspense fallback={<ParticipationHistorySkeleton />}>
      <HistoryWrapper />
    </Suspense>
  );
}

async function HistoryWrapper() {
  const history = await getParticipationHistory();
  if (!history.ok) {
    return (
      <div>Failed to load participation history: {history.data.message}</div>
    );
  }

  return <ParticipationHistoryTable history={history.data} />;
}
