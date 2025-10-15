import { Suspense } from 'react';
import { UserParams } from '../params';
import { UserEntries } from '../components/entries/user-entries';
import { UserEntriesSkeleton } from '../components/entries/user-entries-skeleton';
import { NoEntries } from '../components/entries/no-entries';
import getUserEntries from '@/procedures/user/get-user-entries';

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
  const entries = await getUserEntries({ userId });

  if (!entries.ok) {
    return <div>Error loading entries: {entries.data.message}</div>;
  }

  if (entries.data.length === 0) {
    return <NoEntries />;
  }

  return <UserEntries slug={slug} entries={entries.data} />;
};
