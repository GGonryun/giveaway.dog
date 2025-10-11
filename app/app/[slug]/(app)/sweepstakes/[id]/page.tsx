'use server';

import { redirect } from 'next/navigation';
import { DEFAULT_SWEEPSTAKES_DETAILS_TAB } from '@/lib/settings';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sweepstakes Overview | Giveaway.dog',
  description: 'View sweepstakes details and manage entries',
  robots: {
    index: false,
    follow: false
  }
};

interface SweepstakesDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function SweepstakesDetailPage({
  params
}: SweepstakesDetailPageProps) {
  const { slug, id: sweepstakesId } = await params;
  redirect(
    `/app/${slug}/sweepstakes/${sweepstakesId}/${DEFAULT_SWEEPSTAKES_DETAILS_TAB}`
  );
}
