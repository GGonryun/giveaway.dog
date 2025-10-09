import { Suspense } from 'react';
import { UserDetailView } from '../components/user-detail-view';

interface UserDetailEntriesPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailEntriesPage({
  params
}: UserDetailEntriesPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<div>Loading Entries...</div>}>
      <UserDetailView userId={id} tab="entries" />
    </Suspense>
  );
}
