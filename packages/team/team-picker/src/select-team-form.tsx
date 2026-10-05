import { useProcedure } from '@giveaway/rpc-client/hook';
import { Label } from 'recharts';
import selectTeam from '@giveaway/team-server/select-team';
import { Button } from '@giveaway/ui-primitives/button';
import { PlusIcon } from 'lucide-react';
import { Badge } from '@giveaway/ui-primitives/badge';
import { LoadingState } from './loading-state';
import { MAX_USER_TEAMS } from '@giveaway/app-config/settings';
import { TeamLogo } from './team-logo';

import { useUserTeams } from '@giveaway/team-context/use-user-teams';
import { useTeamsPage } from '@giveaway/team-context/use-teams-page';
import { useTeamPage } from '@giveaway/team-context/use-team-page';
import { toast } from 'sonner';

export const SelectTeamForm: React.FC = () => {
  const { navigateToCreate } = useTeamsPage();
  const { navigateToTeam } = useTeamPage();

  const teams = useUserTeams();

  const selectTeamsProcedure = useProcedure({
    action: selectTeam,
    onSuccess: (team) => {
      navigateToTeam(team);
      toast.success(`Switched to team: ${team.name}`);
    }
  });

  if (selectTeamsProcedure.isLoading)
    return <LoadingState text="Switching to team..." />;
  if (teams.isLoading || teams.isPending)
    return <LoadingState text="Loading teams..." />;

  return (
    <div className="grid gap-4">
      {teams.data.length > 0 ? (
        <div className="grid gap-3">
          <Label>Your Teams</Label>
          <div className="flex flex-col gap-3">
            {teams.data.map((team) => (
              <Button
                key={team.id}
                variant="outline"
                className="p-4 h-auto justify-start hover:bg-muted/50"
                onClick={() => selectTeamsProcedure.run(team)}
              >
                <div className="flex items-center space-x-3 w-full">
                  <TeamLogo
                    logoUrl={team.logo}
                    alt={`${team.name} logo`}
                    size={40}
                  />
                  <div className="flex-1 text-left">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{team.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {team.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      @{team.slug} • {team.memberCount} members
                    </p>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You haven't joined any teams yet. Create your first team to get
            started.
          </p>
        </div>
      )}

      <div className={teams.data.length > 0 ? 'border-t pt-4' : ''}>
        <Button
          variant={teams.data.length === 0 ? 'default' : 'outline'}
          className={
            teams.data.length === 0
              ? 'w-full p-4 h-auto justify-center'
              : 'w-full p-4 h-auto justify-start hover:bg-muted/50'
          }
          onClick={() => navigateToCreate()}
          disabled={teams.data.length >= MAX_USER_TEAMS}
        >
          <PlusIcon
            className={
              teams.data.length === 0
                ? 'h-4 w-4'
                : 'h-4 w-4 text-muted-foreground'
            }
          />
          {teams.data.length >= MAX_USER_TEAMS
            ? 'Team limit reached (5/5)'
            : teams.data.length === 0
              ? 'Create your first team'
              : 'Create new team'}
        </Button>
        {teams.data.length >= 5 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            You can only be a member of up to 5 teams
          </p>
        )}
      </div>
    </div>
  );
};
