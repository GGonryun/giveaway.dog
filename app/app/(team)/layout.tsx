import getUser from '@/procedures/user/get-user';
import { UserProvider } from '@/components/context/user-provider';
import { redirect } from 'next/navigation';
import { ADMIN_DASHBOARD_FEATURE_FLAG_KEY } from '@/schemas/feature-flags';

export default async function Layout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await getUser({ self: true });
  if (!user.ok) {
    console.error(`Failed to get user context`);
    redirect(`/app`);
  }

  if (!user.data.featureFlags?.includes(ADMIN_DASHBOARD_FEATURE_FLAG_KEY)) {
    redirect('/');
  }

  return <UserProvider value={user.data}>{children}</UserProvider>;
}
