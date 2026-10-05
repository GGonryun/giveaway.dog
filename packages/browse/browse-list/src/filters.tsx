'use client';

import { AllGiveawaysSearch } from './components/all-giveaways-search';
import { GiveawayFiltersSheet } from './components/giveaway-filters-sheet';
import { Button } from '@giveaway/ui-primitives/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext
} from '@giveaway/ui-primitives/pagination';
import { HistoryIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';

export type BrowseHost = {
  id: string;
  name: string;
  slug: string;
};

export const BrowsePageFilters: React.FC<{
  children: React.ReactNode;
  hasResults: boolean;
  hasMoreResults: boolean;
  availableHosts: BrowseHost[];
}> = ({ hasResults, hasMoreResults, children, availableHosts }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') ?? '1', 10);
  const currentSearch = searchParams.get('search') ?? '';

  const buildPaginationUrl = (page: number): string => {
    const params = new URLSearchParams(searchParams);
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
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
          <GiveawayFiltersSheet availableHosts={availableHosts} />
          <Button variant="outline" asChild className="flex-1 sm:flex-initial">
            <Link href={'/history'}>
              <HistoryIcon className="h-4 w-4 mr-2" />
              View History
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
                  currentPage > 1 ? buildPaginationUrl(currentPage - 1) : '#'
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
                  hasMoreResults ? buildPaginationUrl(currentPage + 1) : '#'
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
