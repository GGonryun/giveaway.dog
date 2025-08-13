'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { DateRange } from 'react-day-picker';
import { Search, Filter, X, CalendarDays } from 'lucide-react';

interface SweepstakesFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  totalResults?: number;
  isSearching?: boolean;
}

export function SweepstakesFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateRange,
  onDateRangeChange,
  totalResults = 0,
  isSearching = false
}: SweepstakesFilterBarProps) {
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'ending-soon', label: 'Ending Soon' },
    { value: 'draft', label: 'Draft' },
    { value: 'paused', label: 'Paused' },
    { value: 'completed', label: 'Completed' }
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      all: 'secondary',
      active: 'default',
      'ending-soon': 'destructive',
      draft: 'outline',
      paused: 'secondary',
      completed: 'secondary'
    };

    return variants[status] || 'secondary';
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Main Filters Row */}
          <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sweepstakes or prizes..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 bg-background/50 backdrop-blur"
              />
            </div>

            {/* Filter Group with Better Responsive Behavior */}
            <div className="flex flex-wrap sm:flex-nowrap gap-3 lg:flex-shrink-0">
              {/* Status Filter */}
              <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
                <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Select value={statusFilter} onValueChange={onStatusChange}>
                  <SelectTrigger className="w-[140px] bg-background/50 backdrop-blur">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
                <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <DatePickerWithRange
                  date={dateRange}
                  onDateChange={onDateRangeChange}
                  className="bg-background/50 backdrop-blur"
                />
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(searchQuery || statusFilter !== 'all' || dateRange?.from) && (
            <div className="flex items-center gap-2 flex-wrap">
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <button
                    onClick={() => onSearchChange('')}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}

              {statusFilter !== 'all' && (
                <Badge variant={getStatusBadge(statusFilter)} className="gap-1">
                  Status:{' '}
                  {statusOptions.find((s) => s.value === statusFilter)?.label}
                  <button
                    onClick={() => onStatusChange('all')}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}

              {dateRange?.from && (
                <Badge variant="outline" className="gap-1">
                  Date: {dateRange.from.toLocaleDateString()}
                  {dateRange.to && ` - ${dateRange.to.toLocaleDateString()}`}
                  <button
                    onClick={() => onDateRangeChange(undefined)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSearchChange('');
                  onStatusChange('all');
                  onDateRangeChange(undefined);
                }}
                className="h-6 px-2 text-xs hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
