'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronUp, Trophy, Calendar } from 'lucide-react';
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
import { MarketingPageHeader } from '@/components/marketing/marketing-page-header';
import { HISTORY_PAGE_SIZE } from '@/lib/pagination';
import { WinnerLeaderboardSchema } from '@/schemas/giveaway/winners';

export function WinnersLeaderboard({
  winners,
  currentPage
}: {
  winners: WinnerLeaderboardSchema[];
  currentPage: number;
}) {
  const pathname = usePathname();
  const [openWinners, setOpenWinners] = useState<Set<string>>(new Set());
  const hasResults = winners.length > 0;
  const hasMoreResults = winners.length === HISTORY_PAGE_SIZE;

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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="w-full bg-background py-6 sm:py-12 container space-y-8">
      <MarketingPageHeader
        title="Winners Leaderboard"
        description="Top giveaway winners and their prize history"
      />

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
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl font-bold text-muted-foreground w-8 text-right">
                            #{(currentPage - 1) * HISTORY_PAGE_SIZE + index + 1}
                          </div>
                          {index === 0 && currentPage === 1 && (
                            <Trophy className="h-6 w-6 text-yellow-500" />
                          )}
                        </div>
                        <Avatar className="h-12 w-12">
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
                <CardContent className="pt-0 pb-4">
                  <div className="border-t pt-4 space-y-2">
                    {winner.wins.map((win, winIndex) => (
                      <Link
                        key={`${win.sweepstakesId}-${winIndex}`}
                        href={`/app/${win.teamSlug}/sweepstakes/${win.sweepstakesId}/winners/public`}
                        className="block p-3 rounded-lg hover:bg-muted/50 transition-colors"
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
                  currentPage > 1 ? `${pathname}?page=${currentPage - 1}` : '#'
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
                  hasMoreResults ? `${pathname}?page=${currentPage + 1}` : '#'
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
