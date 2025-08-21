'use client';

import { useState, useCallback, useEffect, useTransition, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  MoreVertical,
  Eye,
  UserCheck,
  UserX,
  Tag,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { FilterBar } from './filter-bar';
import { SearchBar } from './search-bar';
import { BulkActionsBar } from './bulk-actions-bar';
import { ExportSheet } from './export-sheet';
import { CRMSyncSheet } from './crm-sync-sheet';
import { UserDetailSheet } from './user-detail-sheet';
import { getUsers } from '../actions';
import { UserData } from '@/schemas/index';
import { useUser } from '@/components/context/user-provider';

interface UsersTableProps {
  initialPage?: number;
  initialPageSize?: number;
}

// Default values
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_SORT_FIELD = 'lastEntryAt';
const DEFAULT_SORT_DIRECTION = 'desc';
const DEFAULT_FILTERS = {
  query: '',
  minScore: 0,
  maxScore: 100,
  status: 'all',
  dateRange: 'all',
  source: 'all'
};

export const UsersTable = ({
  initialPage = DEFAULT_PAGE,
  initialPageSize = DEFAULT_PAGE_SIZE
}: UsersTableProps) => {
  const { activeTeam } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params with defaults
  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get('page');
    return page ? parseInt(page, 10) : DEFAULT_PAGE;
  });
  const [pageSize, setPageSize] = useState(() => {
    const size = searchParams.get('pageSize');
    return size ? parseInt(size, 10) : DEFAULT_PAGE_SIZE;
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(() => {
    return searchParams.get('selectedUser');
  });
  const [sortField, setSortField] = useState<string>(() => {
    return searchParams.get('sortField') || DEFAULT_SORT_FIELD;
  });
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() => {
    return (
      (searchParams.get('sortDirection') as 'asc' | 'desc') ||
      DEFAULT_SORT_DIRECTION
    );
  });
  const [filters, setFilters] = useState(() => ({
    query: searchParams.get('search') || DEFAULT_FILTERS.query,
    minScore: searchParams.get('minScore')
      ? parseInt(searchParams.get('minScore')!, 10)
      : DEFAULT_FILTERS.minScore,
    maxScore: searchParams.get('maxScore')
      ? parseInt(searchParams.get('maxScore')!, 10)
      : DEFAULT_FILTERS.maxScore,
    status: searchParams.get('status') || DEFAULT_FILTERS.status,
    dateRange: searchParams.get('dateRange') || DEFAULT_FILTERS.dateRange,
    source: searchParams.get('source') || DEFAULT_FILTERS.source
  }));
  const [showExportSheet, setShowExportSheet] = useState(false);
  const [showCRMSheet, setShowCRMSheet] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showUserSheet, setShowUserSheet] = useState(false);

  // Load users data with debounced search
  const loadUsers = useCallback(
    async (searchQuery?: string, immediate = false) => {
      // Cancel previous search timeout if it exists
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }

      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const actualQuery =
        searchQuery !== undefined ? searchQuery : filters.query;

      const executeSearch = async () => {
        setLoading(true);
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
          const result = await getUsers({
            page: currentPage,
            pageSize,
            search: actualQuery,
            sortField,
            sortDirection,
            statusFilter: filters.status
          });

          // Only update if request wasn't aborted
          if (!controller.signal.aborted) {
            setUsers(result.users);
            setTotalUsers(result.totalUsers);
            setTotalPages(result.totalPages);
            setLoading(false);
            abortControllerRef.current = null;
          }
        } catch (error) {
          if (!controller.signal.aborted) {
            console.error('Failed to load users:', error);
            setLoading(false);
            abortControllerRef.current = null;
          }
        }
      };

      // Debounce search queries but execute other changes immediately
      if (actualQuery && actualQuery.length > 0 && !immediate) {
        searchTimeoutRef.current = setTimeout(executeSearch, 500);
      } else {
        executeSearch();
      }
    },
    [
      currentPage,
      pageSize,
      filters.query,
      sortField,
      sortDirection,
      filters.status
    ]
  );

  // Update URL params whenever state changes - only include non-default values
  const updateURLParams = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        // Remove parameter if it matches default or is empty
        const shouldRemove =
          value === null ||
          value === '' ||
          (key === 'page' && value === DEFAULT_PAGE) ||
          (key === 'pageSize' && value === DEFAULT_PAGE_SIZE) ||
          (key === 'sortField' && value === DEFAULT_SORT_FIELD) ||
          (key === 'sortDirection' && value === DEFAULT_SORT_DIRECTION) ||
          (key === 'status' && value === DEFAULT_FILTERS.status) ||
          (key === 'source' && value === DEFAULT_FILTERS.source) ||
          (key === 'dateRange' && value === DEFAULT_FILTERS.dateRange) ||
          (key === 'minScore' && value === DEFAULT_FILTERS.minScore) ||
          (key === 'maxScore' && value === DEFAULT_FILTERS.maxScore);

        if (shouldRemove) {
          params.delete(key);
        } else {
          params.set(key, value.toString());
        }
      });

      const newUrl = params.toString() ? `?${params.toString()}` : '';
      router.replace(`/app/${activeTeam.slug}/users${newUrl}`, {
        scroll: false
      });
    },
    [searchParams, router]
  );

  // Initial load on mount
  useEffect(() => {
    loadUsers(undefined, true); // Load initial data immediately
  }, []); // Only run on mount

  // Update URL and reload data when filters change (excluding initial mount)
  useEffect(() => {
    // Always load data when dependencies change (except on very first mount)
    const hasInitialData = users.length > 0;
    if (hasInitialData) {
      loadUsers(undefined, true);
    }
    updateURLParams({
      page: currentPage,
      pageSize,
      sortField,
      sortDirection,
      status: filters.status,
      source: filters.source,
      minScore: filters.minScore,
      maxScore: filters.maxScore,
      dateRange: filters.dateRange
    });
  }, [
    currentPage,
    pageSize,
    sortField,
    sortDirection,
    filters.status,
    filters.source,
    filters.minScore,
    filters.maxScore,
    filters.dateRange
  ]);

  // Handle search query changes with debouncing
  useEffect(() => {
    // Only handle search changes after initial mount
    const hasInitialData = users.length > 0;
    if (hasInitialData) {
      if (filters.query !== '') {
        loadUsers(filters.query, false); // debounced search
      } else {
        loadUsers('', true); // immediate when clearing search
      }
    }
    updateURLParams({ search: filters.query });
  }, [filters.query]);

  // Handle selected user changes
  useEffect(() => {
    updateURLParams({ selectedUser });
  }, [selectedUser]);

  const handleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(field);
        setSortDirection('desc');
      }
      setCurrentPage(1); // Reset to first page when sorting
    },
    [sortField, sortDirection]
  );

  const handleSearch = useCallback((query: string) => {
    startTransition(() => {
      setFilters((prev) => ({ ...prev, query }));
      setCurrentPage(1);
    });
  }, []);

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    // Cancel previous filter timeout if it exists
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
      filterTimeoutRef.current = null;
    }

    // Debounce filter changes (except search which has its own debouncing)
    filterTimeoutRef.current = setTimeout(() => {
      startTransition(() => {
        setFilters(newFilters);
        setCurrentPage(1);
      });
    }, 300);
  }, []);

  // Cleanup function to cancel pending requests and reset loading state
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setLoading(false);
    };
  }, []);

  const handlePageChange = useCallback((page: number) => {
    startTransition(() => {
      setCurrentPage(page);
    });
  }, []);

  const handleSelectUser = useCallback((userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers((prev) => [...prev, userId]);
    } else {
      setSelectedUsers((prev) => prev.filter((id) => id !== userId));
    }
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedUsers(users.map((user) => user.id));
      } else {
        setSelectedUsers([]);
      }
    },
    [users]
  );

  const getStatusBadge = (status: string) => {
    const variants = {
      active: {
        variant: 'default' as const,
        label: 'Active',
        icon: CheckCircle,
        className: 'bg-blue-500 hover:bg-blue-600 text-white'
      },
      flagged: {
        variant: 'destructive' as const,
        label: 'Flagged',
        icon: AlertTriangle,
        className: ''
      },
      blocked: {
        variant: 'secondary' as const,
        label: 'Blocked',
        icon: UserX,
        className: ''
      },
      trusted: {
        variant: 'default' as const,
        label: 'Trusted',
        icon: UserCheck,
        className: ''
      }
    };

    const config = variants[status as keyof typeof variants] || variants.active;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className={`text-xs ${config.className}`}>
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

  return (
    <div className={`space-y-4 ${selectedUsers.length > 0 ? 'pb-24' : ''}`}>
      {/* Bulk Actions Bar - Fixed at bottom when users are selected */}
      {selectedUsers.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30">
          <BulkActionsBar
            selectedCount={selectedUsers.length}
            onClearSelection={() => setSelectedUsers([])}
            onExport={() => setShowExportSheet(true)}
            onCRMSync={() => setShowCRMSheet(true)}
          />
        </div>
      )}

      <div className="w-full">
        {/* Main Users Table */}
        <div>
          <Card>
            <CardHeader>
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

              {/* Filters moved here */}
              <div className="flex flex-col space-y-4 pt-4">
                {/* Search Bar */}
                <div className="w-full max-w-md">
                  <SearchBar
                    value={filters.query}
                    onChange={handleSearch}
                    placeholder="Search by name, email, or ID..."
                  />
                </div>

                {/* Filter and Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex-shrink-0">
                    <FilterBar
                      filters={filters}
                      onChange={handleFilterChange}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      size="sm"
                      onClick={() => setShowExportSheet(true)}
                      className="flex-1 sm:flex-none"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Export</span>
                      <span className="sm:hidden">Export Data</span>
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowCRMSheet(true)}
                      className="flex-1 sm:flex-none"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">CRM Sync</span>
                      <span className="sm:hidden">Sync CRM</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                  <span className="ml-3 text-lg">Loading users...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedUsers.length === users.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>
                          <SortButton field="lastEntryAt">
                            Last Entry
                          </SortButton>
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
                        <TableHead className="hidden xl:table-cell">
                          <SortButton field="source">Source</SortButton>
                        </TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow
                          key={user.id}
                          className={`cursor-pointer hover:bg-muted/50 ${
                            selectedUser === user.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => {
                            setSelectedUser(user.id);
                            setShowUserSheet(true);
                          }}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={(checked) =>
                                handleSelectUser(user.id, !!checked)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar || undefined} />
                                <AvatarFallback className="text-xs">
                                  {user.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                                </AvatarFallback>
                              </Avatar>
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
                                    {user.region}
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
                            {getStatusBadge(user.status)}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            <Badge variant="secondary" className="text-xs">
                              {user.source}
                            </Badge>
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
                                    router.push(`/app/users/${user.id}`);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Full Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUser(user.id);
                                    setShowUserSheet(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Quick View
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Mark Trusted
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Tag className="h-4 w-4 mr-2" />
                                  Add Tag
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View in CRM
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
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
              )}

              {/* Pagination */}
              {!loading && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-3 sm:px-6 py-4 border-t">
                  <div className="flex items-center justify-center sm:justify-start text-xs sm:text-sm text-muted-foreground">
                    <span>
                      <span className="hidden sm:inline">Showing </span>
                      {(currentPage - 1) * pageSize + 1}-
                      {Math.min(currentPage * pageSize, totalUsers)} of{' '}
                      {totalUsers.toLocaleString()}
                      <span className="hidden sm:inline"> users</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1 || loading}
                      className="p-2 sm:px-3"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                      <span className="sr-only">First page</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handlePageChange(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1 || loading}
                      className="p-2 sm:px-3"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Previous page</span>
                    </Button>

                    <div className="flex items-center gap-1 px-2 sm:px-3">
                      <span className="text-xs sm:text-sm font-medium">
                        Page
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs sm:text-sm px-2 py-1"
                      >
                        {currentPage}
                      </Badge>
                      <span className="text-xs sm:text-sm">of</span>
                      <span className="text-xs sm:text-sm font-medium">
                        {totalPages}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handlePageChange(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages || loading}
                      className="p-2 sm:px-3"
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Next page</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages || loading}
                      className="p-2 sm:px-3"
                    >
                      <ChevronsRight className="h-4 w-4" />
                      <span className="sr-only">Last page</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sheets */}
      <ExportSheet
        open={showExportSheet}
        onClose={() => setShowExportSheet(false)}
        selectedUsers={selectedUsers}
        totalUsers={totalUsers}
      />

      <CRMSyncSheet
        open={showCRMSheet}
        onClose={() => setShowCRMSheet(false)}
        selectedUsers={selectedUsers}
      />

      {/* User Detail Sheet - Shown on lg and below */}
      <UserDetailSheet
        userId={selectedUser}
        open={showUserSheet}
        onClose={() => {
          setShowUserSheet(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
};
