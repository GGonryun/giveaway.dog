'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader
} from '@/components/ui/card';
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
import {
  MoreVertical,
  Eye,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle,
  Users,
  ArrowUpDown
} from 'lucide-react';
import { TablePagination } from '@/components/ui/table-pagination';
import { FilterBar } from '../users/filter-bar';
import { SearchBar } from '../users/search-bar';
import { UserDetailSheet } from '../users/user-detail-sheet';
import { StatusExplanationDialog } from '../users/status-explanation-dialog';

import { useTeams } from '@/components/context/team-provider';
import { ParticipatingUserSchema } from '@/schemas/teams';
import { DEFAULT_PAGE_SIZE } from '@/lib/settings';

interface SweepstakesUsersTableProps {
  sweepstakesId: string;
  users?: ParticipatingUserSchema[];
  totalUsers?: number;
  totalPages?: number;
  currentPage?: number;
  filters?: {
    search: string;
    page: number;
    sortField: string;
    sortDirection: 'asc' | 'desc';
    status: string;
    dateRange: string;
    minScore: number;
    maxScore: number;
  };
}

// Mock function to generate sweepstakes participants
const generateMockSweepstakesUsers = (
  sweepstakesId: string
): ParticipatingUserSchema[] => {
  const baseUsers = [
    {
      name: 'Sarah Johnson',
      email: 's***@email.com',
      country: 'US',
      qualityScore: 85,
      engagement: 78
    },
    {
      name: 'Mike Chen',
      email: 'm***@gmail.com',
      country: 'CA',
      qualityScore: 92,
      engagement: 88
    },
    {
      name: 'Emma Williams',
      email: 'e***@outlook.com',
      country: 'UK',
      qualityScore: 78,
      engagement: 65
    },
    {
      name: 'Alex Rodriguez',
      email: 'a***@proton.me',
      country: 'US',
      qualityScore: 45,
      engagement: 42
    },
    {
      name: 'Jessica Park',
      email: 'j***@icloud.com',
      country: 'KR',
      qualityScore: 88,
      engagement: 82
    },
    {
      name: 'David Kim',
      email: 'd***@hotmail.com',
      country: 'CA',
      qualityScore: 91,
      engagement: 89
    },
    {
      name: 'Lisa Zhang',
      email: 'l***@outlook.com',
      country: 'AU',
      qualityScore: 76,
      engagement: 71
    },
    {
      name: 'Tom Wilson',
      email: 't***@gmail.com',
      country: 'US',
      qualityScore: 83,
      engagement: 79
    },
    {
      name: 'Maria Garcia',
      email: 'm***@yahoo.com',
      country: 'ES',
      qualityScore: 67,
      engagement: 58
    },
    {
      name: 'James Brown',
      email: 'j***@gmail.com',
      country: 'UK',
      qualityScore: 94,
      engagement: 91
    }
  ];

  const statuses = ['active', 'blocked'] as const;

  return Array.from({ length: 25 }, (_, i) => {
    const baseUser = baseUsers[i % baseUsers.length];

    // Generate mock entries for this user
    const mockEntries = Array.from(
      { length: Math.floor(Math.random() * 5) + 1 },
      (_, entryIndex) => ({
        taskId: `task-${entryIndex + 1}`,
        name: `Task ${entryIndex + 1}`,
        completedAt: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
        )
      })
    );

    return {
      id: `user-${sweepstakesId}-${i + 1}`,
      name: baseUser.name,
      email: baseUser.email,
      country: baseUser.country,
      qualityScore: baseUser.qualityScore,
      engagement: baseUser.engagement,
      lastEntryAt: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      status: statuses[i % statuses.length],
      entries: mockEntries,
      emailVerified: Math.random() > 0.2,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
  });
};

export const SweepstakesUsers: React.FC<SweepstakesUsersTableProps> = ({
  sweepstakesId,
  users: propUsers,
  totalUsers: propTotalUsers,
  totalPages: propTotalPages,
  currentPage: propCurrentPage = 1,
  filters: propFilters
}) => {
  const { activeTeam } = useTeams();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use mock data if no props provided
  const mockUsers = generateMockSweepstakesUsers(sweepstakesId);
  const users = propUsers || mockUsers;
  const totalUsers = propTotalUsers || users.length;
  const totalPages =
    propTotalPages || Math.ceil(users.length / DEFAULT_PAGE_SIZE);
  const currentPage = propCurrentPage;

  // Default filters
  const defaultFilters = {
    search: '',
    page: 1,
    sortField: 'lastEntryAt',
    sortDirection: 'desc' as const,
    status: 'all',
    dateRange: 'all',
    minScore: 0,
    maxScore: 100
  };

  const filters = propFilters || defaultFilters;

  const [selectedUser, setSelectedUser] =
    useState<ParticipatingUserSchema | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showUserSheet, setShowUserSheet] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusDialogUser, setStatusDialogUser] =
    useState<ParticipatingUserSchema | null>(null);

  // Update URL params for sweepstakes users tab
  const updateURLParams = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams);

      // Apply updates
      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === null ||
          value === '' ||
          (key === 'page' && value === 1) ||
          (key === 'sortField' && value === 'lastEntryAt') ||
          (key === 'sortDirection' && value === 'desc') ||
          (key === 'status' && value === 'all') ||
          (key === 'dateRange' && value === 'all') ||
          (key === 'minScore' && value === 0) ||
          (key === 'maxScore' && value === 100)
        ) {
          params.delete(key);
        } else {
          params.set(key, value.toString());
        }
      });

      const newUrl = params.toString() ? `?${params.toString()}` : '';
      router.push(
        `/app/${activeTeam.slug}/sweepstakes/${sweepstakesId}/users${newUrl}`
      );
    },
    [router, activeTeam.slug, sweepstakesId, searchParams]
  );

  const handleSort = useCallback(
    (field: string) => {
      const newDirection =
        filters.sortField === field && filters.sortDirection === 'desc'
          ? 'asc'
          : 'desc';
      updateURLParams({
        sortField: field,
        sortDirection: newDirection,
        page: 1
      });
    },
    [filters.sortField, filters.sortDirection, updateURLParams]
  );

  const handleSearch = useCallback(
    (query: string) => {
      startTransition(() => {
        updateURLParams({
          search: query,
          page: 1
        });
      });
    },
    [updateURLParams]
  );

  const handleFilterChange = useCallback(
    (newFilters: {
      query: string;
      minScore: number;
      maxScore: number;
      status: string;
      dateRange: string;
    }) => {
      startTransition(() => {
        updateURLParams({
          status: newFilters.status,
          dateRange: newFilters.dateRange,
          minScore: newFilters.minScore,
          maxScore: newFilters.maxScore,
          page: 1
        });
      });
    },
    [updateURLParams]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      startTransition(() => {
        updateURLParams({ page });
      });
    },
    [updateURLParams]
  );

  const getStatusBadge = (status: string, user: ParticipatingUserSchema) => {
    const variants = {
      active: {
        variant: 'default' as const,
        label: 'Active',
        icon: CheckCircle,
        className: 'bg-blue-500 hover:bg-blue-600 text-white'
      },
      blocked: {
        variant: 'secondary' as const,
        label: 'Blocked',
        icon: UserX,
        className: ''
      }
    };

    const config = variants[status as keyof typeof variants] || variants.active;
    const IconComponent = config.icon;

    return (
      <Badge
        variant={config.variant}
        className={`text-xs cursor-pointer hover:opacity-80 transition-opacity ${config.className}`}
        onClick={(e) => {
          e.stopPropagation();
          setStatusDialogUser(user);
          setShowStatusDialog(true);
        }}
      >
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  // Calculate shown entries for pagination
  const startEntry = (currentPage - 1) * DEFAULT_PAGE_SIZE + 1;
  const endEntry = Math.min(currentPage * DEFAULT_PAGE_SIZE, totalUsers);
  const paginatedUsers = users.slice(startEntry - 1, endEntry);

  return (
    <div>
      <div className="w-full space-y-4">
        <div className="flex items-start gap-2">
          {/* Search Bar */}
          <div className="flex-grow">
            <SearchBar
              value={filters.search}
              onChange={handleSearch}
              placeholder="Search participants by name, email, or ID..."
            />
          </div>

          <div className="flex-shrink-0">
            <FilterBar
              filters={{
                query: filters.search,
                minScore: filters.minScore,
                maxScore: filters.maxScore,
                status: filters.status,
                dateRange: filters.dateRange
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
                  <span className="text-lg font-semibold">Participants</span>
                  <Badge variant="secondary">
                    {totalUsers.toLocaleString()} total
                  </Badge>
                </div>
              </div>
              <CardDescription>
                Users participating in this specific sweepstakes.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>
                        <SortButton field="lastEntryAt">Last Entry</SortButton>
                      </TableHead>
                      <TableHead>
                        <SortButton field="qualityScore">Quality</SortButton>
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        <SortButton field="engagement">Engagement</SortButton>
                      </TableHead>
                      <TableHead className="hidden xl:table-cell">
                        <SortButton field="status">Status</SortButton>
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
                              <div className="font-medium text-sm">
                                {user.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {user.email}
                              </div>
                              <div className="mt-1">
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1 py-0"
                                >
                                  {user.country}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(user.lastEntryAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
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
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center space-x-2">
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
                        <TableCell className="hidden xl:table-cell">
                          {getStatusBadge(user.status, user)}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
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
                                  alert('Block user action');
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
                itemName="participants"
                isPending={isPending}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Detail Sheet */}
      <UserDetailSheet
        user={selectedUser}
        open={showUserSheet}
        onClose={() => {
          setShowUserSheet(false);
          setSelectedUser(null);
        }}
      />

      {/* Status Explanation Dialog */}
      <StatusExplanationDialog
        open={showStatusDialog}
        onClose={() => {
          setShowStatusDialog(false);
          setStatusDialogUser(null);
        }}
        status={statusDialogUser?.status || 'active'}
      />
    </div>
  );
};
