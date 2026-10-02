'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Grid3x3, Trophy } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { AllGiveawaysSearch } from '@/components/sweepstakes-browse/components/all-giveaways-search';

export const HistoryFilters: React.FC<{
  children: React.ReactNode;
  hasResults: boolean;
  hasMoreResults: boolean;
}> = ({ children, hasResults, hasMoreResults }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') ?? '1', 10);
  const currentSearch = searchParams.get('search') ?? '';

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
            <Link href={'/browse'}>
              <Grid3x3 className="h-4 w-4 mr-2" />
              Active Giveaways
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1 sm:flex-initial">
            <Link href="/winners">
              <Trophy className="h-4 w-4 mr-2" />
              Winners
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        <div className="flex-1 min-w-0">{children}</div>
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
};
