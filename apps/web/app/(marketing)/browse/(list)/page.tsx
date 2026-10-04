import { SweepstakesPageSkeleton } from '@/components/sweepstakes-browse/sweepstakes-page-skeleton';
import { getPublicSweepstakesParticipation } from '@/lib/participant/procedures/get-public-sweepstakes-participation';
import getPublicSweepstakesList from '@giveaway/browse-server/get-public-sweepstakes-list';
import getBrowseHosts from '@giveaway/browse-server/get-browse-hosts';
import { Metadata } from 'next';
import { Suspense } from 'react';
import {
  BrowseStatus,
  GiveawayFilters
} from '@giveaway/sweepstakes-model/filters/giveaway-filters';
import { BrowsePageFilters } from './filters';
import { AllGiveawaysGrid } from '@/components/sweepstakes-browse/components/all-giveaways-grid';

export const revalidate = 60; // 1 minute in seconds

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

type SearchParams = {
  minEntrants?: string;
  maxEntrants?: string;
  sortBy?: string;
  search?: string;
  page?: string;
  showStatuses?: string;
  hideEntered?: string;
  hosts?: string;
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

const parseShowStatuses = (value?: string): BrowseStatus[] | undefined => {
  if (!value) return undefined;
  const statuses = value.split(',').filter(Boolean) as BrowseStatus[];
  return statuses.length > 0 ? statuses : undefined;
};

const parseHosts = (value?: string): string[] | undefined => {
  if (!value) return undefined;
  const hosts = value.split(',').filter(Boolean);
  return hosts.length > 0 ? hosts : undefined;
};

const Wrapper: React.FC<{ params: SearchParams }> = async ({ params }) => {
  const filters: GiveawayFilters = {
    minEntrants: params.minEntrants ? parseInt(params.minEntrants) : undefined,
    maxEntrants: params.maxEntrants ? parseInt(params.maxEntrants) : undefined,
    sortBy: params.sortBy as GiveawayFilters['sortBy'],
    search: params.search,
    page: params.page ? parseInt(params.page) : 1,
    showStatuses: parseShowStatuses(params.showStatuses),
    hideEntered: params.hideEntered === 'true',
    hosts: parseHosts(params.hosts)
  };

  const [sweepstakes, participation, hosts] = await Promise.all([
    getPublicSweepstakesList(filters),
    getPublicSweepstakesParticipation(),
    getBrowseHosts()
  ]);

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

  if (!hosts.ok)
    return (
      <div>
        [ERROR-{hosts.data.code}]: {hosts.data.message}
      </div>
    );

  return (
    <BrowsePageFilters
      hasResults={sweepstakes.data.length > 0}
      hasMoreResults={sweepstakes.data.length === 20}
      availableHosts={hosts.data}
    >
      <AllGiveawaysGrid
        sweepstakes={sweepstakes.data}
        participation={participation.data}
        hideEntered={filters.hideEntered}
      />
    </BrowsePageFilters>
  );
};
