import getUser from '@/procedures/user/get-user';
import getUserTeam from '@/procedures/teams/get-user-team';
import getUserTeams from '@/procedures/teams/get-user-teams';
import { TeamsProvider } from '@/components/context/team-provider';
import { UserProvider } from '@/components/context/user-provider';
import { redirect } from 'next/navigation';
import { ADMIN_DASHBOARD_FEATURE_FLAG_KEY } from '@/schemas/feature-flags';

export type SlugPageParams = { slug: string };

export default async function Layout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<SlugPageParams>;
}) {
  const resolvedParams = await params;
  const [user, teams, team] = await Promise.all([
    getUser({ self: true }),
    getUserTeams(),
    getUserTeam(resolvedParams)
  ]);
  if (!team.ok || !user.ok || !teams.ok) {
    console.error(
      `Failed to get user context for slug: ${resolvedParams.slug}`
    );
    redirect(`/app`);
  }

  if (!user.data.featureFlags?.includes(ADMIN_DASHBOARD_FEATURE_FLAG_KEY)) {
    redirect('/');
  }

  return (
    <TeamsProvider
      value={{
        activeTeam: team.data,
        teams: teams.data
      }}
    >
      <UserProvider value={user.data}>{children}</UserProvider>
    </TeamsProvider>
  );
}
