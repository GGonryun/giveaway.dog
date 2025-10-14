import { Suspense } from 'react';
import { UserDetailView } from '../components/user-detail-view';
import { UserParams } from '../params';

interface UserDetailRiskPageProps {
  params: Promise<UserParams>;
}

export default async function UserDetailRiskPage({
  params
}: UserDetailRiskPageProps) {
  const { userId } = await params;

  return (
    <Suspense fallback={<div>Loading Risk...</div>}>
      <div>Risk details for user {userId} will be here.</div>
    </Suspense>
  );
}
