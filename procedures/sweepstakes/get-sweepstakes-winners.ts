'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { simulateNetworkDelay } from '@/lib/simulate';

interface SweepstakesWinner {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  selectedAt: string;
  notifiedAt?: string;
  respondedAt?: string;
  claimedAt?: string;
  status: 'selected' | 'notified' | 'responded' | 'claimed' | 'forfeited';
  prize: {
    title: string;
    value: string;
    description: string;
  };
  entryDetails: {
    entryDate: string;
    entryMethod: string;
    totalEntries: number;
  };
  location: string;
  qualityScore: number;
  verificationStatus: 'pending' | 'verified' | 'failed';
  shippingInfo?: {
    address: string;
    trackingNumber?: string;
    shippedAt?: string;
    deliveredAt?: string;
  };
}

interface WinnersData {
  winners: SweepstakesWinner[];
  selectionDetails: {
    selectionMethod: string;
    selectionDate: string;
    totalParticipants: number;
    selectionCriteria: string[];
  };
  prizeDistribution: {
    totalPrizes: number;
    claimedPrizes: number;
    pendingPrizes: number;
    forfeitedPrizes: number;
  };
}

const getSweepstakesWinners = async (
  sweepstakesId: string
): Promise<WinnersData> => {
  'use cache';
  cacheTag('sweepstakes-winners');

  await simulateNetworkDelay();

  // Mock winner data for winner selection
  const mockWinners: SweepstakesWinner[] = [
    {
      id: 'winner_1',
      userId: 'user_1847',
      userName: 'Sarah Johnson',
      userEmail: 'sarah.johnson@gmail.com',
      userAvatar: '',
      selectedAt: '2025-01-15T12:00:00Z',
      notifiedAt: '2025-01-15T12:05:00Z',
      respondedAt: '2025-01-15T14:30:00Z',
      claimedAt: '2025-01-16T09:15:00Z',
      status: 'claimed',
      prize: {
        title: 'iPhone 15 Pro Max 256GB',
        value: '$1,200',
        description: 'Grand Prize - iPhone 15 Pro Max with 256GB storage'
      },
      entryDetails: {
        entryDate: '2025-01-05T10:30:00Z',
        entryMethod: 'Social Follow',
        totalEntries: 3
      },
      location: 'Los Angeles, CA, US',
      qualityScore: 94,
      verificationStatus: 'verified',
      shippingInfo: {
        address: '123 Main St, Los Angeles, CA 90210',
        trackingNumber: 'UPS1234567890',
        shippedAt: '2025-01-18T10:00:00Z'
      }
    },
    {
      id: 'winner_2',
      userId: 'user_3421',
      userName: 'Michael Chen',
      userEmail: 'michael.chen@outlook.com',
      userAvatar: '',
      selectedAt: '2025-01-15T12:00:00Z',
      notifiedAt: '2025-01-15T12:05:00Z',
      respondedAt: '2025-01-15T16:45:00Z',
      status: 'responded',
      prize: {
        title: 'AirPods Pro 2nd Gen',
        value: '$250',
        description: 'Second Prize - AirPods Pro with Active Noise Cancellation'
      },
      entryDetails: {
        entryDate: '2025-01-08T14:20:00Z',
        entryMethod: 'Email Subscription',
        totalEntries: 1
      },
      location: 'Toronto, ON, CA',
      qualityScore: 91,
      verificationStatus: 'verified'
    },
    {
      id: 'winner_3',
      userId: 'user_5632',
      userName: 'Emma Rodriguez',
      userEmail: 'emma.rodriguez@yahoo.com',
      userAvatar: '',
      selectedAt: '2025-01-15T12:00:00Z',
      notifiedAt: '2025-01-15T12:05:00Z',
      status: 'notified',
      prize: {
        title: 'Apple Watch Series 9',
        value: '$400',
        description: 'Third Prize - Apple Watch Series 9 GPS 45mm'
      },
      entryDetails: {
        entryDate: '2025-01-12T09:15:00Z',
        entryMethod: 'Friend Referral',
        totalEntries: 2
      },
      location: 'Madrid, ES',
      qualityScore: 88,
      verificationStatus: 'pending'
    }
  ];

  const winnersData: WinnersData = {
    winners: mockWinners,
    selectionDetails: {
      selectionMethod: 'Random Draw',
      selectionDate: '2025-01-15T12:00:00Z',
      totalParticipants: 4789,
      selectionCriteria: [
        'Valid entries only',
        'Email verified accounts',
        'One entry per person',
        'Eligible countries only'
      ]
    },
    prizeDistribution: {
      totalPrizes: 3,
      claimedPrizes: 1,
      pendingPrizes: 2,
      forfeitedPrizes: 0
    }
  };

  return winnersData;
};

export default getSweepstakesWinners;
