import getUser from '@giveaway/account-server/get-user';
import getUserTeam from '@giveaway/team-server/get-user-team';
import getUserTeams from '@giveaway/team-server/get-user-teams';
import { TeamsProvider } from '@giveaway/team-context/team-provider';
import { UserProvider } from '@giveaway/account-context/user-provider';
import { redirect } from 'next/navigation';
import { TeamPageProps } from '@giveaway/sweepstakes-model/pages';

export default async function Layout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<TeamPageProps>;
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
