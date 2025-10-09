import { Suspense } from 'react';
import { UserDetailView } from '../components/user-detail-view';

interface UserDetailRiskPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailRiskPage({
  params
}: UserDetailRiskPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<div>Loading Risk...</div>}>
      <UserDetailView userId={id} tab="risk" />
    </Suspense>
  );
}
