'use client';

import getUserTeams from '@/procedures/teams/get-user-teams';
import { useProcedure } from '@giveaway/rpc-client/hook';
import { DetailedUserTeam } from '@giveaway/team-model/teams';
import { useEffect, useState } from 'react';

export const useUserTeams = () => {
  const [teams, setTeams] = useState<DetailedUserTeam[]>([]);

  const { run, isLoading, isPending } = useProcedure({
    action: getUserTeams,
    onSuccess: setTeams
  });

  useEffect(() => {
    run();
  }, []);

  return { data: teams, isLoading, isPending };
};
