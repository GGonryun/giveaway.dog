'use server';

import { PickerDrawInterface } from '@/lib/pickers/components/picker-draw-interface';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Picker Winners | Giveaway.dog',
    description: 'Draw and manage picker winners',
    robots: {
      index: false,
      follow: false
    }
  };
}

interface PickerWinnersPageProps {
  params: Promise<{ slug: string; pickerId: string }>;
}

export default async function PickerWinnersPage({
  params
}: PickerWinnersPageProps) {
  const { pickerId } = await params;

  const mockPicker = {
    id: pickerId,
    name: 'Sample Picker',
    status: 'active' as const,
    twitterPostUrl: 'https://x.com/TheGiveawayDog/status/1981626677836083512',
    startDate: new Date('2025-10-20T00:00:00Z'),
    endDate: new Date('2025-10-27T23:59:59Z'),
    timezone: 'America/New_York',
    numberOfWinners: 3,
    createdAt: new Date('2025-10-19T12:00:00Z'),
    updatedAt: new Date('2025-10-22T14:30:00Z')
  };

  const mockFilters = {
    minimumPostCount: 10,
    minimumAccountAgeDays: 30,
    minimumFollowers: 100,
    minimumFollowing: 50,
    hasProfileImage: true,
    hasBanner: false,
    hasLocation: true,
    hasDescription: true
  };

  const mockActions = {
    like: true,
    retweet: true,
    quote: false,
    reply: true
  };

  const mockDraws = [
    {
      id: 'draw_1',
      pickerId,
      drawNumber: 1,
      drawnAt: new Date('2025-10-22T15:00:00Z'),
      numberOfWinners: 3,
      eligibleEntries: 45,
      verificationHash: 'abc123def456',
      winners: [
        {
          id: 'winner_1',
          drawId: 'draw_1',
          twitterUserId: 'twitter_123',
          twitterUsername: 'john_doe',
          twitterDisplayName: 'John Doe',
          twitterProfileImageUrl: null,
          position: 1,
          selectedAt: new Date('2025-10-22T15:00:00Z')
        },
        {
          id: 'winner_2',
          drawId: 'draw_1',
          twitterUserId: 'twitter_456',
          twitterUsername: 'jane_smith',
          twitterDisplayName: 'Jane Smith',
          twitterProfileImageUrl: null,
          position: 2,
          selectedAt: new Date('2025-10-22T15:00:01Z')
        },
        {
          id: 'winner_3',
          drawId: 'draw_1',
          twitterUserId: 'twitter_789',
          twitterUsername: 'bob_wilson',
          twitterDisplayName: 'Bob Wilson',
          twitterProfileImageUrl: null,
          position: 3,
          selectedAt: new Date('2025-10-22T15:00:02Z')
        }
      ]
    }
  ];

  return (
    <PickerDrawInterface
      picker={mockPicker}
      filters={mockFilters}
      actions={mockActions}
      draws={mockDraws}
    />
  );
}
