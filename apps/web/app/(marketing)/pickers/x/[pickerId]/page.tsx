'use server';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTwitterV2PublicPicker } from '@giveaway/x-picker-server/procedures/get-twitter-v2-public-picker';
import { TwitterV2PublicView } from '@/lib/pickers/x/components/twitter-v2-public-view';
import { environment } from '@giveaway/app-config/environment';

export async function generateMetadata({
  params
}: {
  params: Promise<{ pickerId: string }>;
}): Promise<Metadata> {
  const { pickerId } = await params;

  const baseUrl = environment.appUrl();
  const ogImageUrl = `${baseUrl}/api/og/pickers/x/${pickerId}`;

  return {
    title: 'X Picker Results | Giveaway.dog',
    description: 'View verified X picker results and winners on Giveaway.dog',
    openGraph: {
      title: 'X Picker Results | Giveaway.dog',
      description: 'View verified giveaway winners and draw results',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: 'X Picker Results'
        }
      ],
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: 'X Picker Results | Giveaway.dog',
      description: 'View verified giveaway winners and draw results',
      images: [ogImageUrl]
    }
  };
}

interface PageProps {
  params: Promise<{ pickerId: string }>;
}

export default async function TwitterV2PublicPickerPage({ params }: PageProps) {
  const { pickerId } = await params;

  const result = await getTwitterV2PublicPicker({ pickerId });

  if (!result.ok) {
    notFound();
  }

  return <TwitterV2PublicView picker={result.data} />;
}
