'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { simulateNetworkDelay } from '@/lib/simulate';

interface SweepstakesEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  entryDate: string;
  entryMethod: string;
  status: 'valid' | 'pending' | 'invalid' | 'duplicate';
  ipAddress: string;
  location: string;
  deviceFingerprint: string;
  referralSource: string;
  socialActions: {
    followed: boolean;
    shared: boolean;
    tagged: boolean;
  };
  qualityScore: number;
  riskFactors: string[];
}

interface GetSweepstakesEntriesParams {
  page?: number;
  pageSize?: number;
  status?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

interface SweepstakesEntriesResponse {
  entries: SweepstakesEntry[];
  totalEntries: number;
  totalPages: number;
}

const getSweepstakesEntries = async (
  sweepstakesId: string,
  params: GetSweepstakesEntriesParams = {}
): Promise<SweepstakesEntriesResponse> => {
  'use cache';
  cacheTag('sweepstakes-entries');

  await simulateNetworkDelay();

  const {
    page = 1,
    pageSize = 50,
    status = 'all',
    sortField = 'entryDate',
    sortDirection = 'desc'
  } = params;

  // Mock entries data for entry management
  const mockEntries: SweepstakesEntry[] = Array.from(
    { length: 5432 },
    (_, i) => ({
      id: `entry_${i + 1}`,
      userId: `user_${Math.floor(Math.random() * 1000) + 1}`,
      userName: `User ${i + 1}`,
      userEmail: `user${i + 1}@example.com`,
      userAvatar: '',
      entryDate: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      entryMethod: ['Email', 'Social', 'Referral', 'Daily'][
        Math.floor(Math.random() * 4)
      ],
      status: (['valid', 'pending', 'invalid', 'duplicate'] as const)[
        Math.floor(Math.random() * 4)
      ],
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      location: ['New York, US', 'London, UK', 'Tokyo, JP', 'Sydney, AU'][
        Math.floor(Math.random() * 4)
      ],
      deviceFingerprint: `fp_${Math.random().toString(36).substr(2, 9)}`,
      referralSource: ['Instagram', 'Twitter', 'Direct', 'Facebook'][
        Math.floor(Math.random() * 4)
      ],
      socialActions: {
        followed: Math.random() > 0.3,
        shared: Math.random() > 0.6,
        tagged: Math.random() > 0.8
      },
      qualityScore: Math.floor(Math.random() * 40) + 60,
      riskFactors: Math.random() > 0.8 ? ['Multiple IPs', 'Velocity Check'] : []
    })
  );

  // Apply filtering
  let filteredEntries = [...mockEntries];
  if (status !== 'all') {
    filteredEntries = filteredEntries.filter(
      (entry) => entry.status === status
    );
  }

  // Apply sorting
  filteredEntries.sort((a, b) => {
    const aValue = a[sortField as keyof SweepstakesEntry];
    const bValue = b[sortField as keyof SweepstakesEntry];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'desc'
        ? bValue.localeCompare(aValue)
        : aValue.localeCompare(bValue);
    }

    return 0;
  });

  // Apply pagination
  const totalEntries = filteredEntries.length;
  const totalPages = Math.ceil(totalEntries / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedEntries = filteredEntries.slice(
    startIndex,
    startIndex + pageSize
  );

  return {
    entries: paginatedEntries,
    totalEntries,
    totalPages
  };
};

export default getSweepstakesEntries;
