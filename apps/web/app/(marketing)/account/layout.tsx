import { UserProvider } from '@giveaway/account-context/user-provider';
import { redirect } from 'next/navigation';
import getUser from '@/procedures/user/get-user';
import { AccountTabs } from '@/components/account/account-tabs';
import { LogoutButton } from '@/lib/auth/components/logout-button';

export default async function Layout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await getUser({ self: true });

  if (!user.ok) {
    console.error(`Failed to get user on account layout: ${user.data.message}`);
    redirect(`/`);
  }

  return (
    <UserProvider value={user.data}>
      <div className="py-4 space-y-4 container">
        <AccountTabs>{children}</AccountTabs>
        <LogoutButton />
      </div>
    </UserProvider>
  );
}
