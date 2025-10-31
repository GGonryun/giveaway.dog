'use server';

import { PickerUsers } from '@/lib/pickers/components/picker-users';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Picker Users | Giveaway.dog',
    description: 'View and manage picker participants',
    robots: {
      index: false,
      follow: false
    }
  };
}

interface PickerUsersPageProps {
  params: Promise<{ slug: string; pickerId: string }>;
  searchParams: Promise<{ showBlacklisted?: string }>;
}

export default async function PickerUsersPage({
  params,
  searchParams
}: PickerUsersPageProps) {
  const { pickerId } = await params;
  const { showBlacklisted } = await searchParams;

  const mockUsers = [
    {
      id: '1',
      pickerId,
      twitterUserId: 'twitter_123',
      twitterUsername: 'john_doe',
      twitterDisplayName: 'John Doe',
      twitterProfileImageUrl: null,
      isVerifiedUser: true,
      isBlacklisted: false,
      totalEntries: 3,
      likeCount: 1,
      retweetCount: 1,
      quoteCount: 0,
      replyCount: 1,
      filteredEntries: 0,
      firstSeenAt: new Date('2025-10-20T10:00:00Z'),
      lastSeenAt: new Date('2025-10-20T14:30:00Z')
    },
    {
      id: '2',
      pickerId,
      twitterUserId: 'twitter_456',
      twitterUsername: 'jane_smith',
      twitterDisplayName: 'Jane Smith',
      twitterProfileImageUrl: null,
      isVerifiedUser: false,
      isBlacklisted: false,
      totalEntries: 2,
      likeCount: 1,
      retweetCount: 1,
      quoteCount: 0,
      replyCount: 0,
      filteredEntries: 0,
      firstSeenAt: new Date('2025-10-21T09:00:00Z'),
      lastSeenAt: new Date('2025-10-21T09:30:00Z')
    },
    {
      id: '3',
      pickerId,
      twitterUserId: 'twitter_789',
      twitterUsername: 'spam_bot',
      twitterDisplayName: 'Spam Bot',
      twitterProfileImageUrl: null,
      isVerifiedUser: false,
      isBlacklisted: true,
      totalEntries: 5,
      likeCount: 1,
      retweetCount: 1,
      quoteCount: 1,
      replyCount: 2,
      filteredEntries: 5,
      firstSeenAt: new Date('2025-10-19T08:00:00Z'),
      lastSeenAt: new Date('2025-10-22T16:00:00Z')
    }
  ];

  const filteredUsers = mockUsers.filter((user) =>
    showBlacklisted === 'true' ? true : !user.isBlacklisted
  );

  return <PickerUsers users={filteredUsers} />;
}
