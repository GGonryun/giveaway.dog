import { Suspense } from 'react';
import { UserParams } from '../params';
import { UserAgentActivity } from '../components/devices/user-detail-devices';
import { UserDetailDevicesSkeleton } from '../components/devices/user-detail-devices-skeleton';
import { NoDeviceActivity } from '../components/devices/no-device-activity';
import getUserDeviceActivity from '@/procedures/user/get-user-device-activity';

interface PageProps {
  params: Promise<UserParams>;
}

export default async function Page({ params }: PageProps) {
  const awaited = await params;

  return (
    <Suspense fallback={<UserDetailDevicesSkeleton />}>
      <Wrapper {...awaited} />
    </Suspense>
  );
}

const Wrapper: React.FC<UserParams> = async ({ userId }) => {
  const activities = await getUserDeviceActivity({ userId });
  if (!activities.ok) {
    return <div>Error loading devices: {activities.data.message}</div>;
  }

  if (activities.data.length === 0) {
    return <NoDeviceActivity />;
  }

  return <UserAgentActivity activities={activities.data} />;
};
