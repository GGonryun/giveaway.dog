'use server';

import { redirect } from 'next/navigation';
import { simulateNetworkDelay } from '../shared/utils';

interface CreateTeamData {
  name: string;
  slug: string;
  logo?: string;
}

interface CreateTeamResult {
  success: boolean;
  error?: string;
  teamId?: string;
}

const createTeam = async (teamData: CreateTeamData): Promise<void> => {
  await simulateNetworkDelay(2000);

  if (!teamData.name.trim()) {
    throw new Error('Team name is required');
  }

  if (!teamData.slug.trim()) {
    throw new Error('Team slug is required');
  }

  if (!/^[a-z0-9-]+$/.test(teamData.slug)) {
    throw new Error('Team slug can only contain lowercase letters, numbers, and hyphens');
  }

  redirect(`/app/${teamData.slug}`);
};

export default createTeam;