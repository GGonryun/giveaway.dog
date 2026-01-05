import { SweepstakesPageContent } from '@/components/sweepstakes-browse/sweepstakes-page-content';
import { getPublicSweepstakesParticipation } from '@/lib/participant/procedures/get-public-sweepstakes-participation';
import getPublicSweepstakesList from '@/procedures/browse/get-public-sweepstakes-list';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { GiveawayFilters } from '@/lib/filters/giveaway-filters';

export const revalidate = 60; // 1 minutes in seconds, must be statically analyzable

export const metadata: Metadata = {
  title: 'Browse Active Giveaways & Contests | Giveaway.dog',
  description:
    'Discover and enter active giveaways, contests, and sweepstakes. Win amazing prizes from brands and creators. Updated daily with new opportunities to win!',
  keywords: [
    'active giveaways',
    'browse contests',
    'enter sweepstakes',
    'win prizes',
    'free giveaways',
    'daily giveaways'
  ],
  openGraph: {
    title: 'Browse Active Giveaways & Contests | Giveaway.dog',
    description:
      'Discover and enter active giveaways, contests, and sweepstakes. Win amazing prizes from brands and creators.',
    type: 'website',
    url: 'https://giveaway.dog/browse',
    images: [
      {
        url: '/api/og/browse',
        width: 1200,
        height: 630,
        alt: 'Browse Active Giveaways'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Active Giveaways & Contests | Giveaway.dog',
    description:
      'Discover and enter active giveaways, contests, and sweepstakes. Win amazing prizes from brands and creators.',
    images: ['/api/og/browse']
  }
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{
    minEntrants?: string;
    maxEntrants?: string;
    sortBy?: string;
    hideCompleted?: string;
  }>;
}) {
  const params = await searchParams;

  const filters: GiveawayFilters = {
    minEntrants: params.minEntrants ? parseInt(params.minEntrants) : undefined,
    maxEntrants: params.maxEntrants ? parseInt(params.maxEntrants) : undefined,
    sortBy: params.sortBy as GiveawayFilters['sortBy'],
    hideCompleted: params.hideCompleted === 'true'
  };

  const sweepstakes = await getPublicSweepstakesList(filters);
  const participation = await getPublicSweepstakesParticipation();

  if (!sweepstakes.ok)
    return (
      <div>
        [ERROR-{sweepstakes.data.code}]: {sweepstakes.data.message}
      </div>
    );

  if (!participation.ok)
    return (
      <div>
        [ERROR-{participation.data.code}]: {participation.data.message}
      </div>
    );

  return (
    <Suspense>
      <SweepstakesPageContent
        sweepstakes={sweepstakes.data}
        participation={participation.data}
      />
    </Suspense>
  );
}
