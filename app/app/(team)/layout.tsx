import getUser from '@/procedures/user/get-user';
import { UserProvider } from '@/components/context/user-provider';
import { redirect } from 'next/navigation';

export default async function Layout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await getUser({ self: true });
  if (!user.ok) {
    console.error(`Failed to get user`);
    redirect(`/app`);
  }

  return <UserProvider value={user.data}>{children}</UserProvider>;
}
