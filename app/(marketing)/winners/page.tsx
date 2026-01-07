import getWinnersLeaderboard from '@/procedures/browse/get-winners-leaderboard';
import { WINNERS_PAGE_SIZE } from '@/lib/pagination';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { WinnersLeaderboard } from '@/components/winners/winners-leaderboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Winners Leaderboard | Top Giveaway Winners | Giveaway.dog',
  description:
    'View the leaderboard of top giveaway winners and see what prizes they have won. Discover the most successful participants in our community.',
  keywords: [
    'giveaway winners',
    'winners leaderboard',
    'prize winners',
    'top winners',
    'giveaway champions',
    'contest winners'
  ],
  openGraph: {
    title: 'Winners Leaderboard | Top Giveaway Winners | Giveaway.dog',
    description:
      'View the leaderboard of top giveaway winners and see what prizes they have won.',
    type: 'website',
    url: 'https://giveaway.dog/winners',
    images: [
      {
        url: '/api/og/browse',
        width: 1200,
        height: 630,
        alt: 'Winners Leaderboard'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Winners Leaderboard | Top Giveaway Winners | Giveaway.dog',
    description:
      'View the leaderboard of top giveaway winners and see what prizes they have won.',
    images: ['/api/og/browse']
  }
};

function WinnersLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex-1 w-full">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Skeleton className="h-10 flex-1 sm:flex-initial sm:w-[180px]" />
          <Skeleton className="h-10 flex-1 sm:flex-initial sm:w-[140px]" />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-2">
              <div className="flex items-center gap-3">
                <Skeleton className="w-7 h-6" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);
  const search = params.search;

  const winners = await getWinnersLeaderboard({
    page,
    limit: WINNERS_PAGE_SIZE,
    search
  });

  if (!winners.ok)
    return (
      <div>
        [ERROR-{winners.data.code}]: {winners.data.message}
      </div>
    );

  return (
    <Suspense fallback={<WinnersLoadingSkeleton />}>
      <WinnersLeaderboard
        winners={winners.data}
        currentPage={page}
        currentSearch={search ?? ''}
      />
    </Suspense>
  );
}
