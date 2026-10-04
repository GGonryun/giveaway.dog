'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@giveaway/ui-primitives/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@giveaway/ui-primitives/table';
import { TablePagination } from '@giveaway/ui-primitives/table-pagination';
import {
  ParticipationHistory,
  ParticipationHistoryItem
} from '@giveaway/participation-history-model/participation-history';
import {
  Clock,
  Eye,
  LogOut,
  MoreHorizontal,
  TrendingUp,
  Trophy
} from 'lucide-react';
import Link from 'next/link';
import { SweepstakesStatusBadge } from '../sweepstakes/status-badge';
import { toEngagementTheme } from '@giveaway/participant-model/util';
import { datetime } from '@giveaway/util-time/date';
import { Label } from '@giveaway/ui-primitives/label';
import { Switch } from '@giveaway/ui-primitives/switch';
import { Button } from '@giveaway/ui-primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@giveaway/ui-primitives/dropdown-menu';
import { WithdrawParticipationDialog } from './withdraw-participation-dialog';
import { useRouter } from 'next/navigation';
import { DerivedSweepstakeStatus } from '@giveaway/sweepstakes-model/sweepstakes';

const DEFAULT_PAGE_SIZE = 50;

const isWithdrawable = (status: DerivedSweepstakeStatus) =>
  status === 'RUNNING' || status === 'SCHEDULED';

export const ParticipationHistoryTable: React.FC<{
  history: ParticipationHistory;
}> = ({ history }) => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [showWinsOnly, setShowWinsOnly] = useState(false);
  const [withdrawDialog, setWithdrawDialog] = useState<{
    open: boolean;
    item: ParticipationHistoryItem | null;
  }>({ open: false, item: null });

  const filteredData = useMemo(() => {
    if (showWinsOnly) {
      return history.filter((item) => item.hasWon);
    }
    return history;
  }, [history, showWinsOnly]);

  const paginatedData = useMemo(() => {
    const total = filteredData.length;
    const totalPages = Math.ceil(total / DEFAULT_PAGE_SIZE);
    const startIndex = (page - 1) * DEFAULT_PAGE_SIZE;
    const endIndex = startIndex + DEFAULT_PAGE_SIZE;
    const items = filteredData.slice(startIndex, endIndex);

    return {
      items,
      total,
      totalPages
    };
  }, [filteredData, page]);

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

  const winsCount = history.filter((item) => item.hasWon).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="wins-only"
            checked={showWinsOnly}
            onCheckedChange={(checked) => {
              setShowWinsOnly(checked);
              setPage(1);
            }}
          />
          <Label htmlFor="wins-only" className="cursor-pointer">
            Show wins only
            {winsCount > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({winsCount})
              </span>
            )}
          </Label>
        </div>
      </div>

      {filteredData.length === 0 && showWinsOnly ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                You haven't won any giveaways yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
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
                    <TableHead className="w-[50px]"></TableHead>
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
                          <div className="flex items-center gap-2">
                            {item.hasWon && (
                              <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                            )}
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
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/browse/${item.sweepstakesId}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            {isWithdrawable(item.sweepstakesStatus) && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  setWithdrawDialog({ open: true, item })
                                }
                              >
                                <LogOut className="mr-2 h-4 w-4" />
                                Withdraw
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
      )}

      {withdrawDialog.item && (
        <WithdrawParticipationDialog
          open={withdrawDialog.open}
          onOpenChange={(open) =>
            setWithdrawDialog({ ...withdrawDialog, open })
          }
          sweepstakesId={withdrawDialog.item.sweepstakesId}
          sweepstakesName={withdrawDialog.item.sweepstakesName}
          onSuccess={() => {
            setWithdrawDialog({ open: false, item: null });
            router.refresh();
          }}
        />
      )}
    </div>
  );
};
