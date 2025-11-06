'use server';

import { PickerPublicView } from '@/lib/pickers/components/picker-public-view';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicPicker } from '@/lib/pickers/procedures/get-public-picker';

export async function generateMetadata({
  params
}: {
  params: Promise<{ pickerId: string }>;
}): Promise<Metadata> {
  const { pickerId } = await params;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://giveaway.dog';
  const ogImageUrl = `${baseUrl}/api/og/draws/${pickerId}`;

  return {
    title: 'Draw Verification | Giveaway.dog',
    description: 'Verify picker draw results and winners on Giveaway.dog',
    openGraph: {
      title: 'Winner Announcement | Giveaway.dog',
      description: 'View verified giveaway winners and draw results',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: 'Giveaway Winner Announcement'
        }
      ],
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Winner Announcement | Giveaway.dog',
      description: 'View verified giveaway winners and draw results',
      images: [ogImageUrl]
    }
  };
}

interface DrawVerificationPageProps {
  params: Promise<{ pickerId: string }>;
}

export default async function DrawVerificationPage({
  params
}: DrawVerificationPageProps) {
  const { pickerId } = await params;

  const result = await getPublicPicker({ pickerId });

  if (!result.ok) {
    notFound();
  }

  const picker = result.data;

  return <PickerPublicView picker={picker} />;
}
