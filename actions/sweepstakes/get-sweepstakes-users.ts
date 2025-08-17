'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { LatestUserData } from '@/schemas/index';
import { simulateNetworkDelay } from '../shared/utils';

const getSweepstakesUsers = async (
  sweepstakesId: string
): Promise<LatestUserData[]> => {
  'use cache';
  cacheTag('sweepstakes-users');

  await simulateNetworkDelay();

  // Mock user entry data for user entry tracking
  const mockLatestUsers: LatestUserData[] = [
    {
      id: '1',
      name: 'Jessica Martinez',
      email: 'jessica.m@gmail.com',
      avatar: '',
      emailStatus: 'verified',
      signupTime: '3 minutes ago',
      firstSource: 'Instagram',
      location: 'Los Angeles, US',
      qualityScore: 91,
      entries: 1
    },
    {
      id: '2',
      name: 'David Kim',
      email: 'david.kim@outlook.com',
      avatar: '',
      emailStatus: 'verified',
      signupTime: '7 minutes ago',
      firstSource: 'YouTube',
      location: 'Seoul, KR',
      qualityScore: 88,
      entries: 1
    },
    {
      id: '3',
      name: 'Sophie Anderson',
      email: 'sophie.a@proton.me',
      avatar: '',
      emailStatus: 'pending',
      signupTime: '12 minutes ago',
      firstSource: 'TikTok',
      location: 'London, UK',
      qualityScore: 85,
      entries: 1
    },
    {
      id: '4',
      name: 'Miguel Rodriguez',
      email: 'miguel.r@yahoo.com',
      avatar: '',
      emailStatus: 'verified',
      signupTime: '18 minutes ago',
      firstSource: 'Twitter/X',
      location: 'Madrid, ES',
      qualityScore: 79,
      entries: 1
    },
    {
      id: '5',
      name: 'Aisha Patel',
      email: 'aisha.patel@gmail.com',
      avatar: '',
      emailStatus: 'verified',
      signupTime: '23 minutes ago',
      firstSource: 'Direct',
      location: 'Mumbai, IN',
      qualityScore: 94,
      entries: 1
    },
    {
      id: '6',
      name: 'Lucas Silva',
      email: 'lucas.silva@hotmail.com',
      avatar: '',
      emailStatus: 'bounced',
      signupTime: '31 minutes ago',
      firstSource: 'Facebook',
      location: 'São Paulo, BR',
      qualityScore: 42,
      entries: 1
    },
    {
      id: '7',
      name: 'Emma Thompson',
      email: 'emma.t@icloud.com',
      avatar: '',
      emailStatus: 'verified',
      signupTime: '37 minutes ago',
      firstSource: 'Pinterest',
      location: 'Sydney, AU',
      qualityScore: 87,
      entries: 1
    },
    {
      id: '8',
      name: 'Jordan Taylor',
      email: 'j.taylor@tempmail.com',
      avatar: '',
      emailStatus: 'pending',
      signupTime: '42 minutes ago',
      firstSource: 'Reddit',
      location: 'Toronto, CA',
      qualityScore: 56,
      entries: 1
    }
  ];

  return mockLatestUsers;
};

export default getSweepstakesUsers;
