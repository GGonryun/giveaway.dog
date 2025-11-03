'use server';

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import { PickerParticipants } from '@/lib/pickers/components/picker-participants';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Picker Participants | Giveaway.dog',
    description: 'View and manage picker participants',
    robots: {
      index: false,
      follow: false
    }
  };
}

interface PickerParticipantsPageProps {
  params: Promise<{ slug: string; pickerId: string }>;
  searchParams: Promise<{ showFiltered?: string }>;
}

export default async function Page({
  params,
  searchParams
}: PickerParticipantsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <Wrapper params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const Wrapper: React.FC<{
  params: Promise<{ slug: string; pickerId: string }>;
  searchParams: Promise<{ showFiltered?: string }>;
}> = async ({ params, searchParams }) => {
  const { pickerId } = await params;
  const { showFiltered } = await searchParams;

  // TODO: Replace with actual procedure call
  // const result = await getPickerParticipants({ pickerId, showFiltered: showFiltered === 'true' });

  // Mock data
  const mockParticipants = Array.from({ length: 15 }, (_, i) => ({
    id: `user-${i}`,
    pickerId,
    twitterUserId: `twitter-${i}`,
    twitterUsername: `user${i}`,
    twitterDisplayName: `User ${i}`,
    twitterProfileImageUrl:
      i % 3 === 0
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`
        : null,
    isVerifiedUser: i % 7 === 0,
    isBlacklisted: i % 10 === 0,
    totalEntries: Math.floor(Math.random() * 20) + 1,
    likeCount: Math.floor(Math.random() * 10),
    repostCount: Math.floor(Math.random() * 5),
    quoteCount: Math.floor(Math.random() * 3),
    replyCount: Math.floor(Math.random() * 7),
    filteredEntries: i % 5 === 0 ? Math.floor(Math.random() * 5) : 0,
    firstSeenAt: new Date(Date.now() - i * 3600000),
    lastSeenAt: new Date(Date.now() - i * 1800000)
  }));

  const mockActions = {
    pickerId,
    like: true,
    repost: true,
    quote: false,
    reply: true
  };

  const mockFilters = {
    pickerId,
    minimumPostCount: 10,
    minimumAccountAgeDays: 30,
    minimumFollowing: null,
    minimumFollowers: 100,
    hasProfileImage: true,
    hasBanner: false,
    hasLocation: true,
    hasDescription: true
  };

  return (
    <PickerParticipants
      participants={mockParticipants}
      actions={mockActions}
      filters={mockFilters}
      showFiltered={showFiltered === 'true'}
    />
  );
};
