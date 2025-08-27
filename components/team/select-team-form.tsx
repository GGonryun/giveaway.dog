import { useProcedure } from '@/lib/mrpc/hook';
import { Label } from 'recharts';
import selectTeam from '@/procedures/teams/select-team';
import { Button } from '../ui/button';
import { PlusIcon } from 'lucide-react';
import { Badge } from '../ui/badge';
import { LoadingState } from './loading-state';
import { DEFAULT_TEAM_LOGO, MAX_USER_TEAMS } from '@/lib/settings';

import { useUserTeams } from '../hooks/use-user-teams';
import { useTeamsPage } from './use-teams-page';
import { useTeamPage } from './use-team-page';
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
                  <div className="text-2xl">
                    {team.logo || DEFAULT_TEAM_LOGO}
                  </div>
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
          <div className="flex items-center space-x-2">
            <PlusIcon
              className={
                teams.data.length === 0
                  ? 'h-4 w-4'
                  : 'h-4 w-4 text-muted-foreground'
              }
            />
            <span>
              {teams.data.length >= MAX_USER_TEAMS
                ? 'Team limit reached (5/5)'
                : teams.data.length === 0
                  ? 'Create your first team'
                  : 'Create new team'}
            </span>
          </div>
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
