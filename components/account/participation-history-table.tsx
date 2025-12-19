'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { TablePagination } from '@/components/ui/table-pagination';
import { ParticipationHistory } from '@/schemas/participation-history';
import { Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { SweepstakesStatusBadge } from '../sweepstakes/status-badge';
import { toEngagementTheme } from '@/lib/participant/util';
import { datetime } from '@/lib/date';

const DEFAULT_PAGE_SIZE = 50;

export const ParticipationHistoryTable: React.FC<{
  history: ParticipationHistory;
}> = ({ history }) => {
  const [page, setPage] = useState(1);

  const paginatedData = useMemo(() => {
    const total = history.length;
    const totalPages = Math.ceil(total / DEFAULT_PAGE_SIZE);
    const startIndex = (page - 1) * DEFAULT_PAGE_SIZE;
    const endIndex = startIndex + DEFAULT_PAGE_SIZE;
    const items = history.slice(startIndex, endIndex);

    return {
      items,
      total,
      totalPages
    };
  }, [history, page]);

  if (history.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              You haven't participated in any giveaways yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Giveaway</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.items.map((item) => (
                <TableRow key={item.sweepstakesId}>
                  <TableCell>
                    <Link
                      href={`/browse/${item.sweepstakesId}`}
                      className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                    >
                      <div>
                        <div className="font-medium text-sm hover:underline">
                          {item.sweepstakesName}
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-muted rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${toEngagementTheme(item.engagement)}`}
                          style={{ width: `${item.engagement}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium min-w-[2.5rem]">
                        {item.engagement}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <SweepstakesStatusBadge
                      status={item.sweepstakesStatus}
                      startDate={new Date(item.sweepstakesStartDate)}
                      endDate={new Date(item.sweepstakesEndDate)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>
                        {datetime.format(item.lastParticipatedAt, 'short')}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          totalItems={paginatedData.total}
          currentPage={page}
          totalPages={paginatedData.totalPages}
          pageSize={DEFAULT_PAGE_SIZE}
          onPageChange={setPage}
          itemName="giveaways"
        />
      </CardContent>
    </Card>
  );
};
