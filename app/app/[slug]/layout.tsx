import { getUser } from '@/actions/app/get-user';
import getUserTeam from '@/actions/teams/get-user-team';
import getUserTeams from '@/actions/teams/get-user-teams';
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
  const [user, teams, team] = await Promise.all([
    getUser(),
    getUserTeams(),
    getUserTeam(resolvedParams)
  ]);
  if (!team.ok || !user.ok || !teams.ok) {
    console.error(
      `Failed to get user context for slug: ${resolvedParams.slug}`
    );
    redirect(`/app`);
  }

  return (
    <UserProvider
      value={{
        id: user.data.id,
        email: user.data.email,
        activeTeam: team.data,
        teams: teams.data
      }}
    >
      {children}
    </UserProvider>
  );
}
