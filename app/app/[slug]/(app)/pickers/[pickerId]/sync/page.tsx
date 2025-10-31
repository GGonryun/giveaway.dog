'use server';

import { PickerSync } from '@/components/pickers/picker-sync';
import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Picker Sync | Giveaway.dog',
    description: 'Track and manage picker data synchronization',
    robots: {
      index: false,
      follow: false
    }
  };
}

interface PickerSyncPageProps {
  params: Promise<{ slug: string; pickerId: string }>;
}

export default async function Page({ params }: PickerSyncPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <Wrapper params={params} />
    </Suspense>
  );
}

const Wrapper: React.FC<{
  params: Promise<{ slug: string; pickerId: string }>;
}> = async ({ params }) => {
  const { pickerId } = await params;

  const mockJobs = [
    {
      id: 'job_1',
      pickerId,
      endpoint: 'likes' as const,
      status: 'completed' as const,
      scheduledAt: new Date('2025-10-22T10:00:00Z'),
      startedAt: new Date('2025-10-22T10:00:05Z'),
      completedAt: new Date('2025-10-22T10:02:30Z'),
      entriesProcessed: 150,
      entriesAdded: 145,
      errorMessage: null,
      errorDetails: null,
      rateLimitRemaining: 450,
      rateLimitReset: new Date('2025-10-22T13:00:00Z'),
      createdAt: new Date('2025-10-22T09:55:00Z')
    },
    {
      id: 'job_2',
      pickerId,
      endpoint: 'retweets' as const,
      status: 'completed' as const,
      scheduledAt: new Date('2025-10-22T10:05:00Z'),
      startedAt: new Date('2025-10-22T10:05:03Z'),
      completedAt: new Date('2025-10-22T10:06:45Z'),
      entriesProcessed: 89,
      entriesAdded: 89,
      errorMessage: null,
      errorDetails: null,
      rateLimitRemaining: 361,
      rateLimitReset: new Date('2025-10-22T13:00:00Z'),
      createdAt: new Date('2025-10-22T09:55:00Z')
    },
    {
      id: 'job_3',
      pickerId,
      endpoint: 'replies' as const,
      status: 'processing' as const,
      scheduledAt: new Date('2025-10-22T10:10:00Z'),
      startedAt: new Date('2025-10-22T10:10:02Z'),
      completedAt: null,
      entriesProcessed: 45,
      entriesAdded: 42,
      errorMessage: null,
      errorDetails: null,
      rateLimitRemaining: 316,
      rateLimitReset: new Date('2025-10-22T13:00:00Z'),
      createdAt: new Date('2025-10-22T09:55:00Z')
    },
    {
      id: 'job_4',
      pickerId,
      endpoint: 'quotes' as const,
      status: 'pending' as const,
      scheduledAt: new Date('2025-10-22T10:15:00Z'),
      startedAt: null,
      completedAt: null,
      entriesProcessed: 0,
      entriesAdded: 0,
      errorMessage: null,
      errorDetails: null,
      rateLimitRemaining: null,
      rateLimitReset: null,
      createdAt: new Date('2025-10-22T09:55:00Z')
    },
    {
      id: 'job_5',
      pickerId,
      endpoint: 'likes' as const,
      status: 'failed' as const,
      scheduledAt: new Date('2025-10-21T14:00:00Z'),
      startedAt: new Date('2025-10-21T14:00:05Z'),
      completedAt: new Date('2025-10-21T14:00:08Z'),
      entriesProcessed: 0,
      entriesAdded: 0,
      errorMessage: 'Rate limit exceeded',
      errorDetails:
        'X API rate limit exceeded. Next retry scheduled for 2025-10-21T17:00:00Z',
      rateLimitRemaining: 0,
      rateLimitReset: new Date('2025-10-21T17:00:00Z'),
      createdAt: new Date('2025-10-21T13:55:00Z')
    }
  ];

  return <PickerSync jobs={mockJobs} pickerId={pickerId} />;
};
