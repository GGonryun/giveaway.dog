'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { SweepstakesData } from '@/schemas/index';
import { simulateNetworkDelay } from '@/lib/simulate';

interface GetSweepstakesListParams {
  statusFilter?: string;
  search?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

const getSweepstakesList = async (
  params: GetSweepstakesListParams = {}
): Promise<SweepstakesData[]> => {
  'use cache';
  cacheTag('sweepstakes-list');

  await simulateNetworkDelay();

  const mockSweepstakesData: SweepstakesData[] = [
    {
      id: '1',
      title: 'iPhone 15 Pro Max Giveaway',
      status: 'active',
      entries: 5432,
      uniqueEntrants: 4789,
      conversionRate: 7.8,
      botRate: 8.2,
      timeLeft: '5 days 12 hours',
      createdAt: '2025-01-01',
      topSource: 'Instagram',
      prize: '$1,200 iPhone 15 Pro Max'
    },
    {
      id: '2',
      title: 'Gaming Setup Bundle Contest',
      status: 'ending-soon',
      entries: 2890,
      uniqueEntrants: 2456,
      conversionRate: 6.4,
      botRate: 15.3,
      timeLeft: '2 hours 45 minutes',
      createdAt: '2025-01-15',
      topSource: 'Twitter/X',
      prize: '$2,500 Gaming Setup'
    },
    {
      id: '3',
      title: '$500 Amazon Gift Card Sweepstakes',
      status: 'active',
      entries: 1234,
      uniqueEntrants: 1089,
      conversionRate: 9.1,
      botRate: 4.7,
      timeLeft: '12 days 6 hours',
      createdAt: '2025-01-20',
      topSource: 'Direct',
      prize: '$500 Amazon Gift Card'
    },
    {
      id: '4',
      title: 'Tesla Model Y Sweepstakes',
      status: 'draft',
      entries: 0,
      uniqueEntrants: 0,
      conversionRate: 0,
      botRate: 0,
      timeLeft: 'Not started',
      createdAt: '2025-01-25',
      topSource: 'None',
      prize: '$60,000 Tesla Model Y'
    },
    {
      id: '5',
      title: 'MacBook Pro Giveaway',
      status: 'completed',
      entries: 8765,
      uniqueEntrants: 7234,
      conversionRate: 8.9,
      botRate: 6.1,
      timeLeft: 'Ended',
      createdAt: '2024-12-01',
      topSource: 'Instagram',
      prize: '$2,500 MacBook Pro'
    },
    {
      id: '6',
      title: 'PlayStation 5 Holiday Giveaway',
      status: 'active',
      entries: 3456,
      uniqueEntrants: 3012,
      conversionRate: 8.7,
      botRate: 12.8,
      timeLeft: '8 days 3 hours',
      createdAt: '2025-01-10',
      topSource: 'YouTube',
      prize: '$500 PlayStation 5 Console'
    },
    {
      id: '7',
      title: 'Nike Air Jordan Collection',
      status: 'paused',
      entries: 987,
      uniqueEntrants: 856,
      conversionRate: 5.2,
      botRate: 18.3,
      timeLeft: 'Paused',
      createdAt: '2025-01-08',
      topSource: 'TikTok',
      prize: '$300 Nike Air Jordan Sneakers'
    },
    {
      id: '8',
      title: 'Apple Watch Ultra 2 Contest',
      status: 'ending-soon',
      entries: 2567,
      uniqueEntrants: 2234,
      conversionRate: 7.3,
      botRate: 9.1,
      timeLeft: '6 hours 23 minutes',
      createdAt: '2025-01-05',
      topSource: 'Instagram',
      prize: '$800 Apple Watch Ultra 2'
    },
    {
      id: '9',
      title: 'Vacation to Hawaii Sweepstakes',
      status: 'active',
      entries: 7890,
      uniqueEntrants: 6543,
      conversionRate: 12.4,
      botRate: 5.6,
      timeLeft: '15 days 2 hours',
      createdAt: '2024-12-20',
      topSource: 'Facebook',
      prize: '$5,000 Hawaii Vacation Package'
    },
    {
      id: '10',
      title: 'Samsung Galaxy S24 Ultra Giveaway',
      status: 'active',
      entries: 4321,
      uniqueEntrants: 3987,
      conversionRate: 9.8,
      botRate: 7.4,
      timeLeft: '10 days 8 hours',
      createdAt: '2025-01-12',
      topSource: 'Twitter/X',
      prize: '$1,200 Samsung Galaxy S24 Ultra'
    },
    {
      id: '11',
      title: 'Home Theater System Bundle',
      status: 'draft',
      entries: 0,
      uniqueEntrants: 0,
      conversionRate: 0,
      botRate: 0,
      timeLeft: 'Not started',
      createdAt: '2025-01-28',
      topSource: 'None',
      prize: '$3,500 Home Theater System'
    },
    {
      id: '12',
      title: 'Cash Prize $10,000 Sweepstakes',
      status: 'active',
      entries: 12456,
      uniqueEntrants: 10987,
      conversionRate: 15.2,
      botRate: 3.8,
      timeLeft: '20 days 12 hours',
      createdAt: '2024-12-15',
      topSource: 'Email',
      prize: '$10,000 Cash Prize'
    }
  ];

  // Apply filtering and sorting based on params
  let filteredData = [...mockSweepstakesData];

  if (params.statusFilter && params.statusFilter !== 'all') {
    filteredData = filteredData.filter(
      (item) => item.status === params.statusFilter
    );
  }

  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filteredData = filteredData.filter(
      (item) =>
        item.title.toLowerCase().includes(searchLower) ||
        item.prize.toLowerCase().includes(searchLower)
    );
  }

  if (params.sortField) {
    filteredData.sort((a, b) => {
      const aValue = a[params.sortField as keyof SweepstakesData];
      const bValue = b[params.sortField as keyof SweepstakesData];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return params.sortDirection === 'desc'
          ? bValue - aValue
          : aValue - bValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return params.sortDirection === 'desc'
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      }

      return 0;
    });
  }

  return filteredData;
};

export default getSweepstakesList;
