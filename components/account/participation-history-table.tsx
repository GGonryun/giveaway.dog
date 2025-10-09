'use client';

import { useState } from 'react';
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
import { useProcedure } from '@/lib/mrpc/hook';
import getParticipationHistory from '@/procedures/user/get-participation-history';
import { ParticipationHistoryItem } from '@/schemas/participation-history';
import { Clock, TrendingUp } from 'lucide-react';
import { useEffect } from 'react';
import Link from 'next/link';

const DEFAULT_PAGE_SIZE = 10;

export const ParticipationHistoryTable: React.FC = () => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{
    items: ParticipationHistoryItem[];
    total: number;
    totalPages: number;
  } | null>(null);

  const procedure = useProcedure({
    action: getParticipationHistory,
    onSuccess(result) {
      setData(result);
    }
  });

  useEffect(() => {
    procedure.run({ page, pageSize: DEFAULT_PAGE_SIZE });
  }, [page]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEngagementColor = (engagement: number) => {
    if (engagement >= 80) return 'bg-green-500';
    if (engagement >= 60) return 'bg-blue-500';
    if (engagement >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (procedure.isPending && !data) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.items.length === 0) {
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
                <TableHead>Engagement</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
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
                    <div className="text-sm">
                      {item.completedTasks} / {item.totalTasks} tasks
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-muted rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${getEngagementColor(item.engagement)}`}
                          style={{ width: `${item.engagement}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium min-w-[2.5rem]">
                        {item.engagement}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{formatDate(item.lastParticipatedAt)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          totalItems={data.total}
          currentPage={page}
          totalPages={data.totalPages}
          pageSize={DEFAULT_PAGE_SIZE}
          onPageChange={setPage}
          itemName="giveaways"
          isPending={procedure.isLoading}
        />
      </CardContent>
    </Card>
  );
};
