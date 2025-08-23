import getUser from '@/actions/app/get-user';
import { UserProvider } from '@/components/context/user-provider';
import { redirect } from 'next/navigation';

export default async function Layout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user.ok) {
    console.error(`Failed to get user context: ${user.data.message}`);
    redirect(`/`);
  }

  return <UserProvider value={user.data}>{children}</UserProvider>;
}
