import getUser from '@/procedures/user/get-user';
import getUserTeam from '@/procedures/teams/get-user-team';
import getUserTeams from '@/procedures/teams/get-user-teams';
import { TeamsProvider } from '@/components/context/team-provider';
import { UserProvider } from '@/components/context/user-provider';
import { redirect } from 'next/navigation';

export default async function Layout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const user = await getUser();
  if (!user.ok) {
    console.error(
      `Failed to get user context for slug: ${resolvedParams.slug}`
    );
    redirect(`/app`);
  }

  return <UserProvider value={user.data}>{children}</UserProvider>;
}
