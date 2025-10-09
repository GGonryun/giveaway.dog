import { Suspense } from 'react';
import { UserDetailView } from '../components/user-detail-view';

interface UserDetailDevicesPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailDevicesPage({
  params
}: UserDetailDevicesPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<div>Loading Devices...</div>}>
      <UserDetailView userId={id} tab="devices" />
    </Suspense>
  );
}
