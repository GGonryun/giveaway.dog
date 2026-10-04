'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@giveaway/ui-primitives/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@giveaway/ui-primitives/table';
import { Button } from '@giveaway/ui-primitives/button';
import { Badge } from '@giveaway/ui-primitives/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@giveaway/ui-primitives/dropdown-menu';
import { MoreVertical, Eye, UserX, Users, ArrowUpDown } from 'lucide-react';
import { TablePagination } from '@giveaway/ui-primitives/table-pagination';
import { Input } from '@giveaway/ui-primitives/input';
import { Search } from 'lucide-react';

import { useTeams } from '@/components/context/team-provider';
import { UserDetailSheet } from '@/components/sweepstakes-details/user-participant-detail-sheet';
import { UserSourceBadge } from '@/lib/user-source/components/user-source-badge';
import { datetime } from '@giveaway/util-time/date';
import { UserSourceCaption } from '@/lib/user-source/components/user-source-caption';
import { SweepstakesParticipantSchema } from '@/lib/participant/schemas';
import { toMostRecentCompletion } from '@/lib/task/completions';
import { toSweepstakesEngagement } from '@/lib/participant/db';
import { toEngagementTheme } from '@/lib/participant/util';
import {
  toQualityType,
  QUALITY_LABELS
} from '@giveaway/user-quality-model/quality';
import { QUALITY_BADGE_VARIANT } from '@giveaway/user-quality-ui/display';
import { UsersFiltersSheet } from '@/components/users/users-filters-sheet';

interface UsersTableProps {
  initialData: {
    participants: SweepstakesParticipantSchema[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  totalTasks: number;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  initialData,
  totalTasks
}) => {
  const { activeTeam } = useTeams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedUser, setSelectedUser] =
    useState<SweepstakesParticipantSchema | null>(null);
  const [showUserSheet, setShowUserSheet] = useState(false);
  const [searchValue, setSearchValue] = useState(
    searchParams.get('search') || ''
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', page.toString());
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue.trim()) {
        params.set('search', searchValue.trim());
      } else {
        params.delete('search');
      }
      params.delete('page');
      router.push(`?${params.toString()}`);
    },
    [router, searchParams, searchValue]
  );

  const handleSort = useCallback(
    (field: 'lastEntry' | 'qualityScore' | 'name') => {
      const params = new URLSearchParams(searchParams.toString());
      const currentSortBy = params.get('sortBy');
      const currentDirection = params.get('sortDirection');

      if (currentSortBy === field) {
        params.set(
          'sortDirection',
          currentDirection === 'asc' ? 'desc' : 'asc'
        );
      } else {
        params.set('sortBy', field);
        params.set('sortDirection', 'desc');
      }
      params.delete('page');
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const SortButton = ({
    field,
    children
  }: {
    field: 'lastEntry' | 'qualityScore' | 'name';
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-8 px-2 text-xs font-medium"
    >
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  return (
    <div>
      <div className="w-full space-y-4">
        <div className="flex items-start gap-2">
          <form onSubmit={handleSearch} className="flex-grow flex gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          <div className="flex-shrink-0">
            <UsersFiltersSheet />
          </div>
        </div>
        <div>
          <Card className="p-0 overflow-hidden">
            <CardHeader hidden>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span className="text-lg font-semibold">Users</span>
                  <Badge variant="secondary">
                    {initialData.total.toLocaleString()} total
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="hidden lg:table-cell text-right">
                        <SortButton field="qualityScore">Quality</SortButton>
                      </TableHead>
                      <TableHead className="hidden xl:table-cell text-right">
                        Engagement
                      </TableHead>
                      <TableHead className="hidden sm:table-cell text-right">
                        <SortButton field="lastEntry">Last Entry</SortButton>
                      </TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialData.participants.map((participant) => {
                      const lastEntryAt = toMostRecentCompletion(
                        participant.completions
                      );
                      const engagement = toSweepstakesEngagement(
                        participant.completions,
                        totalTasks
                      );

                      return (
                        <TableRow
                          key={participant.id}
                          className={`cursor-pointer hover:bg-muted/50 ${selectedUser?.id === participant.id ? 'bg-muted' : ''}`}
                          onClick={() => {
                            setSelectedUser(participant);
                            setShowUserSheet(true);
                          }}
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div>
                                <div className="flex items-center gap-1">
                                  <UserSourceBadge
                                    source={participant.user.source}
                                  />
                                  <div className="font-medium text-sm">
                                    {participant.user.name}
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  <UserSourceCaption user={participant.user} />
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-right">
                            <Badge
                              variant={
                                QUALITY_BADGE_VARIANT[
                                  toQualityType(participant.user.qualityScore)
                                ]
                              }
                            >
                              {
                                QUALITY_LABELS[
                                  toQualityType(participant.user.qualityScore)
                                ]
                              }
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <div className="w-16 bg-muted rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${toEngagementTheme(
                                    engagement
                                  )}`}
                                  style={{ width: `${engagement}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium min-w-[2.5rem]">
                                {engagement}%
                              </span>
                            </div>
                          </TableCell>
                          {lastEntryAt && (
                            <TableCell className="hidden sm:table-cell text-right">
                              <div className="text-sm">
                                {datetime.format(lastEntryAt, 'tiny')}
                              </div>
                            </TableCell>
                          )}
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                side="bottom"
                                sideOffset={4}
                                avoidCollisions={true}
                              >
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/app/${activeTeam.slug}/users/${participant.id}`
                                    );
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Full Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUser(participant);
                                    setShowUserSheet(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Quick View
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    alert('This feature is coming soon!');
                                  }}
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Block User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <TablePagination
                totalItems={initialData.total}
                currentPage={initialData.page}
                totalPages={initialData.totalPages}
                pageSize={initialData.pageSize}
                onPageChange={handlePageChange}
                itemName="users"
                isPending={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <UserDetailSheet
        totalTasks={totalTasks}
        participant={selectedUser}
        open={showUserSheet}
        onOpenChangeAction={(open) => {
          if (!open) {
            setShowUserSheet(false);
            setSelectedUser(null);
          }
        }}
      />
    </div>
  );
};
