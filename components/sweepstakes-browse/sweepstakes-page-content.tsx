'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { History, Trophy } from 'lucide-react';

import { AllGiveawaysGrid } from './components/all-giveaways-grid';
import { AllGiveawaysSearch } from './components/all-giveaways-search';
import { HostCTA } from './components/host-cta';
import { SubscriptionCTA } from './components/subscription-cta';
import { PublicSweepstakeSchema } from '@/schemas/giveaway/public';
import { MarketingPageHeader } from '../marketing/marketing-page-header';
import { PublicSweepstakesParticipationSchema } from '@/lib/participant/schemas';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { HISTORY_PAGE_SIZE } from '@/lib/pagination';

export const SweepstakesPageContent: React.FC<{
  sweepstakes: PublicSweepstakeSchema[];
  participation: PublicSweepstakesParticipationSchema;
  title?: string;
  description?: string;
  showCTAs?: boolean;
  showPagination?: boolean;
  pageSize?: number;
}> = ({
  sweepstakes,
  participation,
  title = 'Browse Giveaways',
  description = 'Discover active, upcoming, and completed giveaways',
  showCTAs = true,
  showPagination = false,
  pageSize = HISTORY_PAGE_SIZE
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isHistoryPage = pathname === '/history';
  const currentPage = parseInt(searchParams.get('page') ?? '1', 10);
  const hasResults = sweepstakes.length > 0;
  const hasMoreResults = sweepstakes.length === pageSize;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="w-full bg-background py-6 sm:py-12 container space-y-8 sm:space-y-12">
      <div className="mb-8">
        <MarketingPageHeader title={title} description={description} />
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-1 w-full">
            <AllGiveawaysSearch
              onSearch={handleSearch}
              onClear={handleClearSearch}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              asChild
              className="flex-1 sm:flex-initial"
            >
              <Link href={isHistoryPage ? '/browse' : '/history'}>
                <History className="h-4 w-4 mr-2" />
                {isHistoryPage ? 'Active Giveaways' : 'View History'}
              </Link>
            </Button>
            {isHistoryPage && (
              <Button
                variant="outline"
                asChild
                className="flex-1 sm:flex-initial"
              >
                <Link href="/winners">
                  <Trophy className="h-4 w-4 mr-2" />
                  Winners
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="flex-1 min-w-0">
            <AllGiveawaysGrid
              searchQuery={searchQuery}
              sweepstakes={sweepstakes}
              participation={participation}
            />
          </div>
        </div>

        {showPagination && hasResults && (
          <Pagination className="mt-8">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={
                    currentPage > 1
                      ? `${pathname}?page=${currentPage - 1}`
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
      {showCTAs && (
        <>
          <SubscriptionCTA />
          <HostCTA />
        </>
      )}
    </div>
  );
};
