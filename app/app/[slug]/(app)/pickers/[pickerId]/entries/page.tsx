'use server';

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import { PickerEntries } from '@/lib/pickers/components/picker-entries';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Picker Entries | Giveaway.dog',
    description: 'View and manage picker entries',
    robots: {
      index: false,
      follow: false
    }
  };
}

interface PickerEntriesPageProps {
  params: Promise<{ slug: string; pickerId: string }>;
  searchParams: Promise<{ showFiltered?: string }>;
}

export default async function Page({
  params,
  searchParams
}: PickerEntriesPageProps) {
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
  // const result = await getPickerEntries({ pickerId, showFiltered: showFiltered === 'true' });

  // Mock data
  const mockEntries = Array.from({ length: 20 }, (_, i) => ({
    id: `entry-${i}`,
    pickerId,
    userId: i % 3 === 0 ? `user-${i}` : null,
    twitterUserId: `twitter-${i}`,
    twitterUsername: `user${i}`,
    twitterDisplayName: `User ${i}`,
    twitterProfileImage: null,
    actionType: (['like', 'retweet', 'quote', 'reply'] as const)[i % 4],
    timestamp: new Date(Date.now() - i * 3600000),
    filtered: i % 5 === 0,
    createdAt: new Date(Date.now() - i * 3600000)
  }));

  const mockActions = {
    pickerId,
    like: true,
    retweet: true,
    quote: false,
    reply: true
  };

  const mockFilters = {
    pickerId,
    minimumPostCount: 10,
    minimumAccountAgeDays: 30,
    minimumFollowing: null,
    minimumFollowers: 100
  };

  return (
    <PickerEntries
      entries={mockEntries}
      actions={mockActions}
      filters={mockFilters}
      showFiltered={showFiltered === 'true'}
    />
  );
};
