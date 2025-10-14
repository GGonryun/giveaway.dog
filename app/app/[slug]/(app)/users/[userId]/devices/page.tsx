import { Suspense } from 'react';
import { UserParams } from '../params';
import { UserAgentActivity } from '../components/devices/user-detail-devices';
import getUserDeviceActivity from '@/procedures/user/get-user-device-activity';

interface UserDetailDevicesPageProps {
  params: Promise<UserParams>;
}

export default async function UserDetailDevicesPage({
  params
}: UserDetailDevicesPageProps) {
  const { userId } = await params;

  const activities = await getUserDeviceActivity({ userId });
  if (!activities.ok) {
    return <div>Error loading devices: {activities.data.message}</div>;
  }

  return (
    <Suspense fallback={<div>Loading Devices...</div>}>
      <UserAgentActivity activities={activities.data} />
    </Suspense>
  );
}
