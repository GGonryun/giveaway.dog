'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader
} from '@/components/ui/card';
import { browser } from '@/lib/browser';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Eye, UserX, Users, ArrowUpDown } from 'lucide-react';
import { TablePagination } from '@/components/ui/table-pagination';
import { FilterBar } from '../../../../../../components/users/filter-bar';
import { SearchBar } from '../../../../../../components/users/search-bar';

import { useTeams } from '@/components/context/team-provider';
import { DEFAULT_PAGE_SIZE } from '@/lib/settings';
import { UserDetailSheet } from '@/components/sweepstakes-details/user-detail-sheet';
import { SweepstakesParticipantSchema } from '@/schemas/giveaway/participant';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toQualityProgressColor } from '@/schemas/quality';
import { UserStatusBadge } from '@/lib/user/components/user-status-badge';
import { UserSourceBadge } from '@/lib/user-source/components/user-source-badge';
import { datetime } from '@/lib/date';

interface UsersTableProps {
  users: SweepstakesParticipantSchema[];
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users: initialUsers
}) => {
  const { activeTeam } = useTeams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedUser, setSelectedUser] =
    useState<SweepstakesParticipantSchema | null>(null);
  const [showUserSheet, setShowUserSheet] = useState(false);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sortField, setSortField] = useState(
    searchParams.get('sortField') || 'lastEntryAt'
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    (searchParams.get('sortDirection') as 'asc' | 'desc') || 'desc'
  );
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [dateRange, setDateRange] = useState(
    searchParams.get('dateRange') || 'all'
  );
  const [minScore, setMinScore] = useState(
    Number(searchParams.get('minScore')) || 0
  );
  const [maxScore, setMaxScore] = useState(
    Number(searchParams.get('maxScore')) || 100
  );
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get('page')) || 1
  );

  useEffect(() => {
    const params: Record<string, string | null> = {};

    if (search && search.trim() !== '') params.search = search;
    else params.search = null;

    if (sortField !== 'lastEntryAt') params.sortField = sortField;
    else params.sortField = null;

    if (sortDirection !== 'desc') params.sortDirection = sortDirection;
    else params.sortDirection = null;

    if (status !== 'all') params.status = status;
    else params.status = null;

    if (dateRange !== 'all') params.dateRange = dateRange;
    else params.dateRange = null;

    if (minScore > 0) params.minScore = String(minScore);
    else params.minScore = null;

    if (maxScore < 100) params.maxScore = String(maxScore);
    else params.maxScore = null;

    if (currentPage > 1) params.page = String(currentPage);
    else params.page = null;

    browser.changeParams(params);
  }, [
    search,
    sortField,
    sortDirection,
    status,
    dateRange,
    minScore,
    maxScore,
    currentPage
  ]);

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...initialUsers];

    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.id.toLowerCase().includes(searchLower)
      );
    }

    if (status && status !== 'all') {
      filtered = filtered.filter((user) => user.status === status);
    }

    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let dateThreshold: Date;

      switch (dateRange) {
        case 'today':
          dateThreshold = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case '7d':
          dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          dateThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          dateThreshold = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateThreshold = new Date(0);
      }

      filtered = filtered.filter(
        (user) => new Date(user.lastEntryAt) >= dateThreshold
      );
    }

    if (minScore !== undefined && minScore > 0) {
      filtered = filtered.filter((user) => user.qualityScore >= minScore);
    }

    if (maxScore !== undefined && maxScore < 100) {
      filtered = filtered.filter((user) => user.qualityScore <= maxScore);
    }

    if (sortField) {
      filtered.sort((a, b) => {
        let valueA: any, valueB: any;

        switch (sortField) {
          case 'lastEntryAt':
            valueA = new Date(a.lastEntryAt);
            valueB = new Date(b.lastEntryAt);
            break;
          case 'qualityScore':
            valueA = a.qualityScore;
            valueB = b.qualityScore;
            break;
          case 'engagement':
            valueA = a.engagement;
            valueB = b.engagement;
            break;
          case 'status':
            valueA = a.status;
            valueB = b.status;
            break;
          default:
            valueA = new Date(a.lastEntryAt);
            valueB = new Date(b.lastEntryAt);
        }

        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [
    initialUsers,
    search,
    status,
    dateRange,
    minScore,
    maxScore,
    sortField,
    sortDirection
  ]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * DEFAULT_PAGE_SIZE;
    return filteredAndSortedUsers.slice(
      startIndex,
      startIndex + DEFAULT_PAGE_SIZE
    );
  }, [filteredAndSortedUsers, currentPage]);

  const totalUsers = filteredAndSortedUsers.length;
  const totalPages = Math.ceil(totalUsers / DEFAULT_PAGE_SIZE);

  const handleSort = useCallback(
    (field: string) => {
      const newDirection =
        sortField === field && sortDirection === 'desc' ? 'asc' : 'desc';
      setSortField(field);
      setSortDirection(newDirection);
      setCurrentPage(1);
    },
    [sortField, sortDirection]
  );

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback(
    (newFilters: {
      query: string;
      minScore: number;
      maxScore: number;
      status: string;
      dateRange: string;
    }) => {
      setStatus(newFilters.status);
      setDateRange(newFilters.dateRange);
      setMinScore(newFilters.minScore);
      setMaxScore(newFilters.maxScore);
      setCurrentPage(1);
    },
    []
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const SortButton = ({
    field,
    children
  }: {
    field: string;
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
          <div className="flex-grow">
            <SearchBar
              value={search}
              onChange={handleSearch}
              placeholder="Search by name, email, or ID..."
            />
          </div>

          <div className="flex-shrink-0">
            <FilterBar
              filters={{
                query: search,
                minScore: minScore,
                maxScore: maxScore,
                status: status,
                dateRange: dateRange
              }}
              onChange={handleFilterChange}
            />
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
                    {totalUsers.toLocaleString()} total
                  </Badge>
                </div>
              </div>
              <CardDescription>
                Manage and analyze your user base with comprehensive filtering
                and bulk operations.
              </CardDescription>
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
                        <SortButton field="engagement">Engagement</SortButton>
                      </TableHead>
                      <TableHead className="hidden sm:table-cell text-right">
                        <SortButton field="lastEntryAt">Last Entry</SortButton>
                      </TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        className={`cursor-pointer hover:bg-muted/50 ${
                          selectedUser?.id === user.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserSheet(true);
                        }}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div>
                              <div className="flex items-center gap-1">
                                <UserSourceBadge source={user.source} />
                                <div className="font-medium text-sm">
                                  {user.name}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {user.email ?? 'No email'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="w-16 bg-muted rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  user.qualityScore >= 80
                                    ? 'bg-green-500'
                                    : user.qualityScore >= 60
                                      ? 'bg-yellow-500'
                                      : user.qualityScore >= 40
                                        ? 'bg-orange-500'
                                        : 'bg-red-500'
                                }`}
                                style={{ width: `${user.qualityScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium min-w-[2rem]">
                              {user.qualityScore}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="w-16 bg-muted rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  user.engagement >= 80
                                    ? 'bg-green-500'
                                    : user.engagement >= 60
                                      ? 'bg-blue-500'
                                      : user.engagement >= 40
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                }`}
                                style={{ width: `${user.engagement}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium min-w-[2.5rem]">
                              {user.engagement}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-right">
                          <div className="text-sm">
                            {datetime.format(user.lastEntryAt, 'tiny')}
                          </div>
                        </TableCell>
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
                                    `/app/${activeTeam.slug}/users/${user.id}`
                                  );
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Full Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUser(user);
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
                    ))}
                  </TableBody>
                </Table>
              </div>
              <TablePagination
                totalItems={totalUsers}
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={DEFAULT_PAGE_SIZE}
                onPageChange={handlePageChange}
                itemName="users"
                isPending={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <UserDetailSheet
        user={selectedUser}
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
