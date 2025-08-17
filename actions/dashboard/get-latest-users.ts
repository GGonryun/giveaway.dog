'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { LatestUserData } from '@/schemas/index';
import { simulateNetworkDelay } from '../shared/utils';

const getLatestUsers = async (): Promise<LatestUserData[]> => {
  'use cache';
  cacheTag('latest-users');

  await simulateNetworkDelay();

  const mockLatestUsers: LatestUserData[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      avatar: '',
      emailStatus: 'verified',
      signupTime: '2 minutes ago',
      firstSource: 'Instagram',
      location: 'California, US',
      qualityScore: 85,
      entries: 2
    },
    {
      id: '2',
      name: 'Mike Chen',
      email: 'mike.chen@gmail.com',
      avatar: '',
      emailStatus: 'pending',
      signupTime: '8 minutes ago',
      firstSource: 'Twitter/X',
      location: 'Toronto, CA',
      qualityScore: 92,
      entries: 1
    },
    {
      id: '3',
      name: 'Emma Williams',
      email: 'emma.w@outlook.com',
      avatar: '',
      emailStatus: 'verified',
      signupTime: '15 minutes ago',
      firstSource: 'Direct',
      location: 'London, UK',
      qualityScore: 78,
      entries: 3
    },
    {
      id: '4',
      name: 'Alex Rodriguez',
      email: 'alex.r@proton.me',
      avatar: '',
      emailStatus: 'bounced',
      signupTime: '23 minutes ago',
      firstSource: 'Facebook',
      location: 'Miami, US',
      qualityScore: 45,
      entries: 1
    }
  ];

  return mockLatestUsers;
};

export default getLatestUsers;
