import { SweepstakesPageSkeleton } from '@/components/sweepstakes-browse/sweepstakes-page-skeleton';
import { getPublicSweepstakesParticipation } from '@/lib/participant/procedures/get-public-sweepstakes-participation';
import getHistoricalSweepstakesList from '@giveaway/browse-server/get-historical-sweepstakes-list';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { GiveawayFilters } from '@giveaway/sweepstakes-model/filters/giveaway-filters';
import { HistoryFilters } from './filters';
import { AllGiveawaysGrid } from '@/components/sweepstakes-browse/components/all-giveaways-grid';

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

type SearchParams = {
  minEntrants?: string;
  maxEntrants?: string;
  sortBy?: string;
  search?: string;
  page?: string;
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <Suspense fallback={<SweepstakesPageSkeleton />}>
      <Wrapper params={params} />
    </Suspense>
  );
}

const Wrapper: React.FC<{ params: SearchParams }> = async ({ params }) => {
  const page = params.page ? parseInt(params.page) : 1;
  const filters: GiveawayFilters & { page?: number } = {
    minEntrants: params.minEntrants ? parseInt(params.minEntrants) : undefined,
    maxEntrants: params.maxEntrants ? parseInt(params.maxEntrants) : undefined,
    sortBy: params.sortBy as GiveawayFilters['sortBy'],
    search: params.search,
    page
  };

  const sweepstakes = await getHistoricalSweepstakesList(filters);

  if (!sweepstakes.ok)
    return (
      <div>
        [ERROR-{sweepstakes.data.code}]: {sweepstakes.data.message}
      </div>
    );

  return (
    <HistoryFilters
      hasResults={sweepstakes.data.length > 0}
      hasMoreResults={sweepstakes.data.length === 20}
    >
      <AllGiveawaysGrid sweepstakes={sweepstakes.data} participation={{}} />
    </HistoryFilters>
  );
};
