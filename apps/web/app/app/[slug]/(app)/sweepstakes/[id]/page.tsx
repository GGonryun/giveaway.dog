'use server';

import { redirect } from 'next/navigation';
import { DEFAULT_SWEEPSTAKES_DETAILS_TAB } from '@/schemas/sweepstakes';
import type { Metadata } from 'next';
import { SweepstakesPageProps } from '@/schemas/pages';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Sweepstakes Overview | Giveaway.dog',
    description: 'View sweepstakes details and manage entries',
    robots: {
      index: false,
      follow: false
    }
  };
}

interface SweepstakesDetailPageProps {
  params: Promise<SweepstakesPageProps>;
}

export default async function SweepstakesDetailPage({
  params
}: SweepstakesDetailPageProps) {
  const { slug, id: sweepstakesId } = await params;
  redirect(
    `/app/${slug}/sweepstakes/${sweepstakesId}/${DEFAULT_SWEEPSTAKES_DETAILS_TAB}`
  );
}
