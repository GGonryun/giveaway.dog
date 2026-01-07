'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar,
  History,
  Grid3x3,
  Trophy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
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
  const [expandedWinners, setExpandedWinners] = useState<Set<string>>(
    new Set()
  );
  const hasResults = winners.length > 0;
  const hasMoreResults = winners.length === WINNERS_PAGE_SIZE;

  const toggleExpanded = (userId: string) => {
    setExpandedWinners((prev) => {
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

      {!hasResults && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No winners to display yet
          </CardContent>
        </Card>
      )}

      {hasResults && (
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
                  {winners.map((winner, index) => {
                    const isExpanded = expandedWinners.has(winner.userId);
                    return (
                      <>
                        <TableRow key={winner.userId}>
                          <TableCell className="font-bold text-muted-foreground">
                            #{(currentPage - 1) * WINNERS_PAGE_SIZE + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
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
                              <div>
                                <div className="font-semibold">
                                  {winner.userName || 'Anonymous Winner'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Trophy className="h-4 w-4 text-yellow-500" />
                              <span className="font-semibold">
                                {winner.winCount}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {winner.wins.slice(0, 3).map((win, winIndex) => (
                                <Link
                                  key={`${win.sweepstakesId}-${winIndex}`}
                                  href={`/browse/${win.sweepstakesId}`}
                                  className="block text-sm hover:underline"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="truncate">
                                        {win.sweepstakesName}
                                      </div>
                                      {win.prizeName && (
                                        <div className="text-xs text-muted-foreground truncate">
                                          {win.prizeName}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(win.wonAt)}
                                    </div>
                                  </div>
                                </Link>
                              ))}
                              {winner.wins.length > 3 && !isExpanded && (
                                <div className="text-xs text-muted-foreground">
                                  +{winner.wins.length - 3} more
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {winner.wins.length > 3 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpanded(winner.userId)}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow key={`${winner.userId}-expanded`}>
                            <TableCell colSpan={5} className="bg-muted/30">
                              <div className="space-y-1 py-2">
                                <div className="text-sm font-semibold mb-2">
                                  All Prizes
                                </div>
                                {winner.wins.map((win, winIndex) => (
                                  <Link
                                    key={`${win.sweepstakesId}-${winIndex}`}
                                    href={`/browse/${win.sweepstakesId}`}
                                    className="block p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1 min-w-0">
                                        <div className="truncate">
                                          {win.sweepstakesName}
                                        </div>
                                        {win.prizeName && (
                                          <div className="text-xs text-muted-foreground truncate">
                                            {win.prizeName}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(win.wonAt)}
                                      </div>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

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
