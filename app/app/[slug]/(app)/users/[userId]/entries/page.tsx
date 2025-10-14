import { Suspense } from 'react';
import { UserDetailView } from '../components/user-detail-view';
import { UserParams } from '../params';

interface UserDetailEntriesPageProps {
  params: Promise<UserParams>;
}

export default async function UserDetailEntriesPage({
  params
}: UserDetailEntriesPageProps) {
  const { userId, slug } = await params;

  return (
    <Suspense fallback={<div>Loading Entries...</div>}>
      <div>Entries for user {userId} will be here.</div>
    </Suspense>
  );
}
