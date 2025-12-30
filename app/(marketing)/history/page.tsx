import { SweepstakesPageContent } from '@/components/sweepstakes-browse/sweepstakes-page-content';
import { getPublicSweepstakesParticipation } from '@/lib/participant/procedures/get-public-sweepstakes-participation';
import getHistoricalSweepstakesList from '@/procedures/browse/get-historical-sweepstakes-list';
import { HISTORY_PAGE_SIZE } from '@/lib/pagination';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Giveaway History | Past Contests & Sweepstakes | Giveaway.dog',
  description:
    'Browse historical records of completed giveaways, contests, and sweepstakes. See past winners and prize distributions from brands and creators.',
  keywords: [
    'giveaway history',
    'past contests',
    'completed sweepstakes',
    'previous giveaways',
    'giveaway archive',
    'past winners'
  ],
  openGraph: {
    title: 'Giveaway History | Past Contests & Sweepstakes | Giveaway.dog',
    description:
      'Browse historical records of completed giveaways, contests, and sweepstakes. See past winners and prize distributions.',
    type: 'website',
    url: 'https://giveaway.dog/history',
    images: [
      {
        url: '/api/og/browse',
        width: 1200,
        height: 630,
        alt: 'Giveaway History'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Giveaway History | Past Contests & Sweepstakes | Giveaway.dog',
    description:
      'Browse historical records of completed giveaways, contests, and sweepstakes. See past winners and prize distributions.',
    images: ['/api/og/browse']
  }
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);
  const sweepstakes = await getHistoricalSweepstakesList({
    page,
    limit: HISTORY_PAGE_SIZE
  });
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
    <Suspense fallback={<div>Loading...</div>}>
      <SweepstakesPageContent
        sweepstakes={sweepstakes.data}
        participation={participation.data}
        title="Giveaway History"
        description="Browse historical records of completed giveaways and see past winners"
        showCTAs={false}
        showPagination={true}
        pageSize={HISTORY_PAGE_SIZE}
      />
    </Suspense>
  );
}
