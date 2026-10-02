'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

interface TablePaginationProps {
  totalItems: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemName?: string;
  isPending?: boolean;
}

export function TablePagination({
  totalItems,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  itemName = 'items',
  isPending = false
}: TablePaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-3 sm:px-6 py-2 border-t">
      <div className="flex items-center justify-center sm:justify-start text-xs sm:text-sm text-muted-foreground">
        <span>
          <span className="hidden sm:inline">Showing </span>
          {startItem}-{endItem} of {totalItems.toLocaleString()}
          <span className="hidden sm:inline"> {itemName}</span>
        </span>
      </div>

      <div className="flex items-center justify-center gap-1 sm:gap-2">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || isPending}
        >
          <ChevronsLeft />
          <span className="sr-only">First page</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || isPending}
        >
          <ChevronLeft />
          <span className="sr-only">Previous page</span>
        </Button>

        <div className="flex items-center gap-1 px-2 sm:px-3">
          <span className="text-xs sm:text-sm font-medium">Page</span>
          <Badge variant="outline" className="text-xs sm:text-sm px-2 py-1">
            {currentPage}
          </Badge>
          <span className="text-xs sm:text-sm">of</span>
          <span className="text-xs sm:text-sm font-medium">{totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || isPending}
        >
          <ChevronRight />
          <span className="sr-only">Next page</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || isPending}
        >
          <ChevronsRight />
          <span className="sr-only">Last page</span>
        </Button>
      </div>
    </div>
  );
}
