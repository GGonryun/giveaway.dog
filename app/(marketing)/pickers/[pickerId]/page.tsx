'use server';

import { PickerDrawVerification } from '@/lib/pickers/components/picker-draw-verification';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Draw Verification | Giveaway.dog',
    description: 'Verify picker draw results and winners'
  };
}

interface DrawVerificationPageProps {
  params: Promise<{ pickerId: string }>;
}

export default async function DrawVerificationPage({
  params
}: DrawVerificationPageProps) {
  const { pickerId } = await params;

  const mockPicker = {
    id: pickerId,
    name: 'Sample Picker',
    status: 'complete' as const,
    twitterPostUrl: 'https://x.com/TheGiveawayDog/status/1981626677836083512',
    startDate: new Date('2025-10-20T00:00:00Z'),
    endDate: new Date('2025-10-27T23:59:59Z'),
    timezone: 'America/New_York',
    numberOfWinners: 3,
    createdAt: new Date('2025-10-19T12:00:00Z'),
    updatedAt: new Date('2025-10-22T14:30:00Z')
  };

  const mockDraw = {
    id: pickerId,
    pickerId,
    drawNumber: 1,
    drawnAt: new Date('2025-10-22T15:00:00Z'),
    numberOfWinners: 3,
    eligibleEntries: 45,
    verificationHash: 'abc123def456789ghijklmnop',
    winners: [
      {
        id: 'winner_1',
        pickerId,
        twitterUserId: 'twitter_123',
        twitterUsername: 'john_doe',
        twitterDisplayName: 'John Doe',
        twitterProfileImageUrl: null,
        position: 1,
        selectedAt: new Date('2025-10-22T15:00:00Z')
      },
      {
        id: 'winner_2',
        pickerId,
        twitterUserId: 'twitter_456',
        twitterUsername: 'jane_smith',
        twitterDisplayName: 'Jane Smith',
        twitterProfileImageUrl: null,
        position: 2,
        selectedAt: new Date('2025-10-22T15:00:01Z')
      },
      {
        id: 'winner_3',
        pickerId,
        twitterUserId: 'twitter_789',
        twitterUsername: 'bob_wilson',
        twitterDisplayName: 'Bob Wilson',
        twitterProfileImageUrl: null,
        position: 3,
        selectedAt: new Date('2025-10-22T15:00:02Z')
      }
    ]
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

  const mockStats = {
    totalEntries: 150,
    totalParticipants: 48,
    filteredEntries: 105
  };

  const mockAuditLogs = [
    {
      id: 'audit_1',
      pickerId,
      action: 'picker_created' as const,
      performedBy: 'user_123',
      performedByUsername: 'admin_user',
      metadata: { initialStatus: 'pending' },
      createdAt: new Date('2025-10-19T12:00:00Z')
    },
    {
      id: 'audit_2',
      pickerId,
      action: 'sync_started' as const,
      performedBy: 'system',
      performedByUsername: null,
      metadata: { endpoint: 'likes', priority: 'normal' },
      createdAt: new Date('2025-10-20T08:00:00Z')
    },
    {
      id: 'audit_3',
      pickerId,
      action: 'entries_imported' as const,
      performedBy: 'system',
      performedByUsername: null,
      metadata: { count: 150, endpoint: 'likes' },
      createdAt: new Date('2025-10-20T10:30:00Z')
    },
    {
      id: 'audit_4',
      pickerId,
      action: 'sync_completed' as const,
      performedBy: 'system',
      performedByUsername: null,
      metadata: { totalEntries: 150, duration: '2h 30m' },
      createdAt: new Date('2025-10-20T10:35:00Z')
    },
    {
      id: 'audit_5',
      pickerId,
      action: 'draw_started' as const,
      performedBy: 'user_123',
      performedByUsername: 'admin_user',
      metadata: { numberOfWinners: 3, eligibleEntries: 45 },
      createdAt: new Date('2025-10-22T15:00:00Z')
    },
    {
      id: 'audit_6',
      pickerId,
      action: 'draw_completed' as const,
      performedBy: 'system',
      performedByUsername: null,
      metadata: {
        winnersSelected: 3,
        verificationHash: 'abc123def456789ghijklmnop'
      },
      createdAt: new Date('2025-10-22T15:00:03Z')
    }
  ];

  return (
    <PickerDrawVerification
      picker={mockPicker}
      draw={mockDraw}
      filters={mockFilters}
      actions={mockActions}
      stats={mockStats}
      auditLogs={mockAuditLogs}
    />
  );
}
