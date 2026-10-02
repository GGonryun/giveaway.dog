import getWinnersLeaderboard from '@/procedures/browse/get-winners-leaderboard';
import { WINNERS_PAGE_SIZE } from '@/lib/pagination';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { WinnersLeaderboard } from '@/components/winners/winners-leaderboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

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
      <Card className="p-0 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Winner</TableHead>
                  <TableHead className="text-right">Total Wins</TableHead>
                  <TableHead>Recent Prizes</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-7" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-5 w-8" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type SearchParams = {
  page?: string;
  search?: string;
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <Suspense fallback={<WinnersLoadingSkeleton />}>
      <Wrapper params={params} />
    </Suspense>
  );
}

const Wrapper: React.FC<{ params: SearchParams }> = async ({ params }) => {
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
    <WinnersLeaderboard
      winners={winners.data}
      currentPage={page}
      currentSearch={search ?? ''}
    />
  );
};
