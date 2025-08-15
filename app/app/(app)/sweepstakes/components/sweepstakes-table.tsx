'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SweepstakesPagination } from './sweepstakes-pagination';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Eye,
  Edit,
  Copy,
  Pause,
  Play,
  Trash2,
  MoreHorizontal,
  Calendar,
  Users,
  Target,
  Shield,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  X,
  RefreshCcw,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface SweepstakesItem {
  id: string;
  title: string;
  status: 'active' | 'ending-soon' | 'draft' | 'paused' | 'completed';
  entries: number;
  uniqueEntrants: number;
  conversionRate: number;
  botRate: number;
  timeLeft: string;
  createdAt: string;
  topSource: string;
  prize: string;
}

interface SweepstakesTableProps {
  sweepstakes: SweepstakesItem[];
  sortField?: SortField | null;
  sortDirection?: SortDirection;
  onSort?: (field: SortField) => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  filters?: {
    status: string;
    dateRange: string;
    conversionRange: { min: number; max: number };
  };
  onFiltersChange?: (filters: any) => void;
}

interface SweepstakesTableWithFiltersProps {
  sweepstakes: SweepstakesItem[];
}

// Search and Filter Components
function SweepstakesSearchBar({
  value,
  onChange,
  placeholder = 'Search sweepstakes...'
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-9 pr-9"
      />
      {localValue && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted rounded"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

function SweepstakesFilterDialog({
  filters,
  onChange
}: {
  filters: {
    status: string;
    dateRange: string;
    conversionRange: { min: number; max: number };
  };
  onChange: (filters: any) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  const updateLocalFilter = (key: string, value: any) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onChange(localFilters);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setLocalFilters(filters);
    setIsOpen(false);
  };

  const resetFilters = () => {
    const defaultFilters = {
      status: 'all',
      dateRange: 'all',
      conversionRange: { min: 0, max: 100 }
    };
    setLocalFilters(defaultFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.conversionRange.min > 0 || filters.conversionRange.max < 100)
      count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-1" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-[80vh] overflow-y-auto" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filters</h4>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <RefreshCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>

          <Separator />

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-1" />
              Status
            </label>
            <Select
              value={localFilters.status}
              onValueChange={(value) => updateLocalFilter('status', value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="ending-soon">Ending Soon</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Date Range
            </label>
            <Select
              value={localFilters.dateRange}
              onValueChange={(value) => updateLocalFilter('dateRange', value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Apply/Cancel Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function SweepstakesTable({
  sweepstakes,
  sortField,
  sortDirection,
  onSort,
  searchQuery = '',
  onSearchChange,
  filters,
  onFiltersChange
}: SweepstakesTableProps) {
  // Helper component for sortable headers
  const SortableHeader = ({
    field,
    children,
    className = ''
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => {
    if (!onSort) {
      return <TableHead className={className}>{children}</TableHead>;
    }

    const getSortIcon = () => {
      if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
      if (sortDirection === 'asc') return <ArrowUp className="h-4 w-4" />;
      if (sortDirection === 'desc') return <ArrowDown className="h-4 w-4" />;
      return <ArrowUpDown className="h-4 w-4" />;
    };

    return (
      <TableHead
        className={`cursor-pointer hover:bg-muted/50 select-none ${className}`}
        onClick={() => onSort(field)}
      >
        <div className="flex items-center space-x-2">
          <span>{children}</span>
          {getSortIcon()}
        </div>
      </TableHead>
    );
  };

  const getStatusBadge = (status: SweepstakesItem['status']) => {
    const variants = {
      active: {
        variant: 'default' as const,
        label: 'Active',
        color: 'text-green-600'
      },
      'ending-soon': {
        variant: 'destructive' as const,
        label: 'Ending Soon',
        color: 'text-red-600'
      },
      draft: {
        variant: 'secondary' as const,
        label: 'Draft',
        color: 'text-gray-600'
      },
      paused: {
        variant: 'outline' as const,
        label: 'Paused',
        color: 'text-yellow-600'
      },
      completed: {
        variant: 'secondary' as const,
        label: 'Completed',
        color: 'text-blue-600'
      }
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: SweepstakesItem['status']) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'ending-soon':
        return <Clock className="h-4 w-4 text-red-500" />;
      case 'draft':
        return <Edit className="h-4 w-4 text-gray-500" />;
      case 'completed':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>All Sweepstakes</span>
          <Badge variant="secondary">{sweepstakes.length}</Badge>
        </CardTitle>

        {/* Search and Filters */}
        {(onSearchChange || onFiltersChange) && (
          <div className="flex flex-col sm:flex-row gap-3">
            {onSearchChange && (
              <SweepstakesSearchBar
                value={searchQuery}
                onChange={onSearchChange}
                placeholder="Search sweepstakes by title, prize, status..."
              />
            )}
            {onFiltersChange && filters && (
              <SweepstakesFilterDialog
                filters={filters}
                onChange={onFiltersChange}
              />
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {/* Mobile Card View */}
        <div className="block lg:hidden">
          <div className="space-y-3 p-4">
            {sweepstakes.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {getStatusIcon(item.status)}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/app/sweepstakes/${item.id}`}
                          className="font-medium hover:text-primary hover:underline block truncate"
                        >
                          {item.title}
                        </Link>
                        <div className="text-xs text-muted-foreground truncate">
                          {item.prize}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Entries
                      </div>
                      <div className="font-medium">
                        {item.entries.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.uniqueEntrants.toLocaleString()} unique
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Performance
                      </div>
                      <div className="space-y-1">
                        <div
                          className={`text-xs font-medium ${
                            item.conversionRate > 8
                              ? 'text-green-600'
                              : item.conversionRate > 5
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          Conv: {item.conversionRate.toFixed(1)}%
                        </div>
                        <div
                          className={`text-xs font-medium ${
                            item.botRate > 20
                              ? 'text-red-500'
                              : item.botRate > 10
                                ? 'text-yellow-500'
                                : 'text-green-500'
                          }`}
                        >
                          Bot: {item.botRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{item.timeLeft}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/app/sweepstakes/${item.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/app/sweepstakes/${item.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {item.status === 'active' ? (
                            <DropdownMenuItem className="text-yellow-600">
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </DropdownMenuItem>
                          ) : item.status === 'paused' ? (
                            <DropdownMenuItem className="text-green-600">
                              <Play className="h-4 w-4 mr-2" />
                              Resume
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="title" className="w-[300px]">
                  Sweepstakes
                </SortableHeader>
                <SortableHeader field="status">Status</SortableHeader>
                <SortableHeader field="entries" className="text-right">
                  Entries
                </SortableHeader>
                <SortableHeader field="conversionRate" className="text-right">
                  Conversion
                </SortableHeader>
                <SortableHeader field="botRate" className="text-right">
                  Bot Rate
                </SortableHeader>
                <TableHead>Time Left</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sweepstakes.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <div>
                          <Link
                            href={`/app/sweepstakes/${item.id}`}
                            className="font-medium hover:text-primary hover:underline line-clamp-1"
                          >
                            {item.title}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {item.prize}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="space-y-1">
                      <div className="font-medium flex items-center justify-end space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{item.entries.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.uniqueEntrants.toLocaleString()} unique
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Target className="h-3 w-3" />
                      <span
                        className={`font-medium ${
                          item.conversionRate > 8
                            ? 'text-green-600'
                            : item.conversionRate > 5
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        {item.conversionRate.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Shield className="h-3 w-3" />
                      <span
                        className={`font-medium ${
                          item.botRate > 20
                            ? 'text-red-500'
                            : item.botRate > 10
                              ? 'text-yellow-500'
                              : 'text-green-500'
                        }`}
                      >
                        {item.botRate.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{item.timeLeft}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/app/sweepstakes/${item.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/app/sweepstakes/${item.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {item.status === 'active' ? (
                            <DropdownMenuItem className="text-yellow-600">
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </DropdownMenuItem>
                          ) : item.status === 'paused' ? (
                            <DropdownMenuItem className="text-green-600">
                              <Play className="h-4 w-4 mr-2" />
                              Resume
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Empty State */}
        {sweepstakes.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No sweepstakes found</p>
            <Button asChild className="mt-2" size="sm">
              <Link href="/app/host">Create Your First Sweepstakes</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type SortField =
  | 'title'
  | 'status'
  | 'entries'
  | 'conversionRate'
  | 'botRate'
  | 'createdAt';
type SortDirection = 'asc' | 'desc' | null;

export function SweepstakesTableWithFilters({
  sweepstakes: allSweepstakes
}: SweepstakesTableWithFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'all',
    dateRange: searchParams.get('dateRange') || 'all',
    conversionRange: {
      min: Number(searchParams.get('conversionMin')) || 0,
      max: Number(searchParams.get('conversionMax')) || 100
    }
  });
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get('page')) || 1
  );
  const [pageSize, setPageSize] = useState(
    Number(searchParams.get('size')) || 10
  );
  const [sortField, setSortField] = useState<SortField | null>(
    (searchParams.get('sortField') as SortField) || null
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    (searchParams.get('sortDir') as SortDirection) || null
  );

  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Update URL when filters change
  const updateURL = useCallback(
    (params: Record<string, string | number>) => {
      const newSearchParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (
          value &&
          value !== '' &&
          value !== 'all' &&
          value !== 1 &&
          value !== 10
        ) {
          newSearchParams.set(key, value.toString());
        }
      });

      const newURL = newSearchParams.toString()
        ? `${window.location.pathname}?${newSearchParams.toString()}`
        : window.location.pathname;

      router.replace(newURL, { scroll: false });
    },
    [router]
  );

  // Handle column sorting
  const handleSort = (field: SortField) => {
    let newDirection: SortDirection = 'asc';

    if (sortField === field) {
      if (sortDirection === 'asc') {
        newDirection = 'desc';
      } else if (sortDirection === 'desc') {
        newDirection = null;
      } else {
        newDirection = 'asc';
      }
    }

    setSortField(newDirection ? field : null);
    setSortDirection(newDirection);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Update URL when filters change
  useEffect(() => {
    updateURL({
      q: debouncedQuery,
      status: filters.status,
      dateRange: filters.dateRange,
      conversionMin: filters.conversionRange.min,
      conversionMax: filters.conversionRange.max,
      page: currentPage,
      size: pageSize,
      sortField: sortField || '',
      sortDir: sortDirection || ''
    });
  }, [
    debouncedQuery,
    filters,
    currentPage,
    pageSize,
    sortField,
    sortDirection,
    updateURL
  ]);

  // Enhanced filtering with more searchable fields
  const filteredData = allSweepstakes.filter((sweepstakes) => {
    const query = debouncedQuery.toLowerCase().trim();

    const matchesSearch =
      !query ||
      sweepstakes.title.toLowerCase().includes(query) ||
      sweepstakes.prize.toLowerCase().includes(query) ||
      sweepstakes.topSource.toLowerCase().includes(query) ||
      sweepstakes.entries.toString().includes(query) ||
      sweepstakes.status.toLowerCase().includes(query) ||
      sweepstakes.createdAt.includes(query) ||
      sweepstakes.timeLeft.toLowerCase().includes(query);

    const matchesStatus =
      filters.status === 'all' || sweepstakes.status === filters.status;

    // Date range filtering based on created date
    const matchesDateRange = (() => {
      if (filters.dateRange === 'all') return true;

      const sweepstakesDate = new Date(sweepstakes.createdAt);
      const now = new Date();

      switch (filters.dateRange) {
        case 'today':
          return sweepstakesDate.toDateString() === now.toDateString();
        case '7d':
          return (
            sweepstakesDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          );
        case '30d':
          return (
            sweepstakesDate >=
            new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          );
        case '90d':
          return (
            sweepstakesDate >=
            new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          );
        case '1y':
          return (
            sweepstakesDate >=
            new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          );
        default:
          return true;
      }
    })();

    // Conversion rate filtering
    const matchesConversion =
      sweepstakes.conversionRate >= filters.conversionRange.min &&
      sweepstakes.conversionRate <= filters.conversionRange.max;

    return (
      matchesSearch && matchesStatus && matchesDateRange && matchesConversion
    );
  });

  // Apply sorting
  const sortedData =
    sortField && sortDirection
      ? [...filteredData].sort((a, b) => {
          let aValue: any;
          let bValue: any;

          switch (sortField) {
            case 'title':
              aValue = a.title.toLowerCase();
              bValue = b.title.toLowerCase();
              break;
            case 'status':
              // Sort by status priority: active > ending-soon > draft > paused > completed
              const statusOrder = {
                active: 0,
                'ending-soon': 1,
                draft: 2,
                paused: 3,
                completed: 4
              };
              aValue = statusOrder[a.status] ?? 5;
              bValue = statusOrder[b.status] ?? 5;
              break;
            case 'entries':
              aValue = a.entries;
              bValue = b.entries;
              break;
            case 'conversionRate':
              aValue = a.conversionRate;
              bValue = b.conversionRate;
              break;
            case 'botRate':
              aValue = a.botRate;
              bValue = b.botRate;
              break;
            case 'createdAt':
              aValue = new Date(a.createdAt).getTime();
              bValue = new Date(b.createdAt).getTime();
              break;
            default:
              return 0;
          }

          if (sortDirection === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          }
        })
      : filteredData;

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Reset to page 1 if current page exceeds total pages
  const safePage = currentPage > totalPages && totalPages > 0 ? 1 : currentPage;

  // Update current page if it was reset
  useEffect(() => {
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
  }, [safePage, currentPage]);

  const startIndex = (safePage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6">
      {/* Sweepstakes Table */}
      <SweepstakesTable
        sweepstakes={paginatedData}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
          setCurrentPage(1);
        }}
      />

      {/* Pagination */}
      <SweepstakesPagination
        totalResults={sortedData.length}
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1); // Reset to first page when page size changes
        }}
      />
    </div>
  );
}
