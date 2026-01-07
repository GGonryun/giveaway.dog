'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  History,
  Grid3x3
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { WINNERS_PAGE_SIZE } from '@/lib/pagination';
import { WinnerLeaderboardSchema } from '@/schemas/giveaway/winners';
import { AllGiveawaysSearch } from '@/components/sweepstakes-browse/components/all-giveaways-search';

export function WinnersLeaderboard({
  winners,
  currentPage,
  currentSearch
}: {
  winners: WinnerLeaderboardSchema[];
  currentPage: number;
  currentSearch: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openWinners, setOpenWinners] = useState<Set<string>>(new Set());
  const hasResults = winners.length > 0;
  const hasMoreResults = winners.length === WINNERS_PAGE_SIZE;

  const toggleWinner = (userId: string) => {
    setOpenWinners((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set('search', query);
    } else {
      params.delete('search');
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClearSearch = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    params.delete('page');
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex-1 w-full">
          <AllGiveawaysSearch
            onSearch={handleSearch}
            onClear={handleClearSearch}
            defaultValue={currentSearch}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" asChild className="flex-1 sm:flex-initial">
            <Link href="/browse">
              <Grid3x3 className="h-4 w-4 mr-2" />
              Active Giveaways
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1 sm:flex-initial">
            <Link href="/history">
              <History className="h-4 w-4 mr-2" />
              History
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {!hasResults && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No winners to display yet
            </CardContent>
          </Card>
        )}

        {winners.map((winner, index) => (
          <Collapsible
            key={winner.userId}
            open={openWinners.has(winner.userId)}
            onOpenChange={() => toggleWinner(winner.userId)}
          >
            <Card>
              <CollapsibleTrigger asChild>
                <button className="w-full text-left hover:bg-muted/50 transition-colors">
                  <CardContent className="py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-bold text-muted-foreground w-7 text-right">
                            #{(currentPage - 1) * WINNERS_PAGE_SIZE + index + 1}
                          </div>
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={
                              winner.userImage ??
                              `https://avatar.vercel.sh/${winner.userId}`
                            }
                            alt={winner.userName || 'Winner'}
                          />
                          <AvatarFallback>
                            {winner.userName?.charAt(0) ?? 'W'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">
                            {winner.userName || 'Anonymous Winner'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {winner.winCount}{' '}
                            {winner.winCount === 1 ? 'win' : 'wins'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          {openWinners.has(winner.userId) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 pb-2">
                  <div className="border-t pt-2 space-y-1">
                    {winner.wins.map((win, winIndex) => (
                      <Link
                        key={`${win.sweepstakesId}-${winIndex}`}
                        href={`/browse/${win.sweepstakesId}`}
                        className="block p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {win.sweepstakesName}
                            </div>
                            {win.prizeName && (
                              <div className="text-sm text-muted-foreground">
                                Prize: {win.prizeName}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                            <Calendar className="h-4 w-4" />
                            {formatDate(win.wonAt)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      {hasResults && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={
                  currentPage > 1
                    ? (() => {
                        const params = new URLSearchParams(searchParams);
                        params.set('page', (currentPage - 1).toString());
                        return `${pathname}?${params.toString()}`;
                      })()
                    : '#'
                }
                aria-disabled={currentPage <= 1}
                className={
                  currentPage <= 1 ? 'pointer-events-none opacity-50' : ''
                }
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                {currentPage}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href={
                  hasMoreResults
                    ? (() => {
                        const params = new URLSearchParams(searchParams);
                        params.set('page', (currentPage + 1).toString());
                        return `${pathname}?${params.toString()}`;
                      })()
                    : '#'
                }
                aria-disabled={!hasMoreResults}
                className={
                  !hasMoreResults ? 'pointer-events-none opacity-50' : ''
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
