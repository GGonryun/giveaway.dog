import getWinnersLeaderboard from '@/procedures/browse/get-winners-leaderboard';
import { HISTORY_PAGE_SIZE } from '@/lib/pagination';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { WinnersLeaderboard } from '@/components/winners/winners-leaderboard';

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

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);
  const winners = await getWinnersLeaderboard({
    page,
    limit: HISTORY_PAGE_SIZE
  });

  if (!winners.ok)
    return (
      <div>
        [ERROR-{winners.data.code}]: {winners.data.message}
      </div>
    );

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WinnersLeaderboard winners={winners.data} currentPage={page} />
    </Suspense>
  );
}
