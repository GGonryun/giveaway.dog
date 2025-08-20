'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { simulateNetworkDelay } from '../shared/utils';

export interface Team {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  memberCount: number;
  role: 'owner' | 'admin' | 'member';
}

const getUserTeams = async (): Promise<Team[]> => {
  'use cache';
  cacheTag('user-teams');

  await simulateNetworkDelay();

  const mockTeams: Team[] = [
    {
      id: '1',
      name: 'Tech Startup Co',
      slug: 'tech-startup',
      logo: '🚀',
      memberCount: 12,
      role: 'owner'
    },
    {
      id: '2',
      name: 'Marketing Agency',
      slug: 'marketing-agency',
      logo: '📈',
      memberCount: 8,
      role: 'admin'
    },
    {
      id: '3',
      name: 'Gaming Community',
      slug: 'gaming-hub',
      logo: '🎮',
      memberCount: 245,
      role: 'member'
    }
  ];

  return mockTeams;
};

export default getUserTeams;