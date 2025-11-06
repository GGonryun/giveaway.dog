'use server';

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import { PickerParticipants } from '@/lib/pickers/components/picker-participants';
import { getPublicPicker } from '@/lib/pickers/procedures/get-public-picker';

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
  const users = await getPublicPicker({ pickerId });

  if (!users.ok) {
    return <div>Failed to load picker: {users.data.message}</div>;
  }

  return (
    <PickerParticipants
      participants={users.data.users}
      showFiltered={showFiltered === 'true'}
    />
  );
};
