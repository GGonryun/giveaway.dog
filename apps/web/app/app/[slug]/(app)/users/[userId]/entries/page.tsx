import { Suspense } from 'react';
import { UserParams } from '@giveaway/audience-user-details/params';
import { UserEntries } from '@giveaway/audience-user-details/components/entries/user-entries';
import { UserEntriesSkeleton } from '@giveaway/audience-user-details/components/entries/user-entries-skeleton';
import { NoEntries } from '@giveaway/audience-user-details/components/entries/no-entries';
import { getTaskCompletions } from '@giveaway/participant-server/get-task-completions';

interface UserDetailEntriesPageProps {
  params: Promise<UserParams>;
}

export default async function UserDetailEntriesPage({
  params
}: UserDetailEntriesPageProps) {
  const awaited = await params;

  return (
    <Suspense fallback={<UserEntriesSkeleton />}>
      <Wrapper {...awaited} />
    </Suspense>
  );
}

const Wrapper: React.FC<UserParams> = async ({ userId, slug }) => {
  const entries = await getTaskCompletions({ userId });

  if (!entries.ok) {
    return <div>Error loading entries: {entries.data.message}</div>;
  }

  if (entries.data.length === 0) {
    return <NoEntries />;
  }

  return <UserEntries slug={slug} entries={entries.data} />;
};
