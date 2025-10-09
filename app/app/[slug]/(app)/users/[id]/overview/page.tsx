import { Suspense } from 'react';
import { UserDetailView } from '../components/user-detail-view';

interface UserDetailOverviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailOverviewPage({
  params
}: UserDetailOverviewPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<div>Loading Overview...</div>}>
      <UserDetailView userId={id} tab="overview" />
    </Suspense>
  );
}
