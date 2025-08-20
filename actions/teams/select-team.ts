'use server';

import { redirect } from 'next/navigation';
import { simulateNetworkDelay } from '../shared/utils';
import getUserTeams from './get-user-teams';

interface SelectTeamResult {
  success: boolean;
  error?: string;
}

const selectTeam = async (teamId: string): Promise<void> => {
  await simulateNetworkDelay();

  const teams = await getUserTeams();
  const selectedTeam = teams.find(team => team.id === teamId);
  
  if (!selectedTeam) {
    throw new Error('Team not found');
  }

  redirect(`/app/${selectedTeam.slug}`);
};

export default selectTeam;