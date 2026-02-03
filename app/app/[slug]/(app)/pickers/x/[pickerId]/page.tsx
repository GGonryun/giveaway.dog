'use server';

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import { getTwitterV2Picker } from '@/lib/pickers-v2/twitter-v2/procedures/get-twitter-v2-picker';
import { TwitterV2PickerOverview } from '@/lib/pickers-v2/twitter-v2/components/twitter-v2-picker-overview';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'X Picker | Giveaway.dog',
    description: 'View your picker status and details',
    robots: {
      index: false,
      follow: false
    }
  };
}

interface PageProps {
  params: Promise<{ slug: string; pickerId: string }>;
}

export default async function Page({ params }: PageProps) {
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
  const { slug, pickerId } = await params;

  const picker = await getTwitterV2Picker({ pickerId });
  if (!picker.ok) {
    return <div>Failed to load picker: {picker.data.message}</div>;
  }

  return <TwitterV2PickerOverview picker={picker.data} slug={slug} />;
};
