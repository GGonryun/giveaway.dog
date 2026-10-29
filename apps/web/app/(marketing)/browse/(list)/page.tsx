import { SweepstakesPageSkeleton } from '@giveaway/browse-list/sweepstakes-page-skeleton';
import { getPublicSweepstakesParticipation } from '@giveaway/participant-server/get-public-sweepstakes-participation';
import getPublicSweepstakesList from '@giveaway/browse-server/get-public-sweepstakes-list';
import getBrowseHosts from '@giveaway/browse-server/get-browse-hosts';
import { Metadata } from 'next';
import { Suspense } from 'react';
import {
  GiveawayFiltersQuery,
  parseGiveawayFilters
} from '@giveaway/sweepstakes-model/filters/giveaway-filters';
import { BrowsePageFilters } from '@giveaway/browse-list/filters';
import { AllGiveawaysGrid } from '@giveaway/browse-list/components/all-giveaways-grid';

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

type SearchParams = GiveawayFiltersQuery;

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
  const filters = parseGiveawayFilters(params);

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
