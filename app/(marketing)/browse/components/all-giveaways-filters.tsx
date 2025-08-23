'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, X, SlidersHorizontal } from 'lucide-react';
import { Typography } from '@/components/ui/typography';

export type FilterStatus = 'all' | 'active' | 'ended';
export type SortOption =
  | 'start-date-asc'
  | 'start-date-desc'
  | 'end-date-asc'
  | 'end-date-desc'
  | 'entries-asc'
  | 'entries-desc';

interface FilterOptions {
  status: FilterStatus;
  region: string | null;
  sortBy: SortOption;
}

interface AllGiveawaysFiltersProps {
  onFiltersChange?: (filters: FilterOptions) => void;
}

const regions = [
  { value: 'all', label: 'All Regions' },
  { value: 'worldwide', label: 'Worldwide' },
  { value: 'north-america', label: 'North America' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia', label: 'Asia' },
  { value: 'oceania', label: 'Oceania' },
  { value: 'south-america', label: 'South America' },
  { value: 'africa', label: 'Africa' }
];

const sortOptions = [
  { value: 'end-date-asc', label: 'End Date (Earliest First)' },
  { value: 'end-date-desc', label: 'End Date (Latest First)' },
  { value: 'start-date-desc', label: 'Start Date (Newest First)' },
  { value: 'start-date-asc', label: 'Start Date (Oldest First)' },
  { value: 'entries-desc', label: 'Most Entries' },
  { value: 'entries-asc', label: 'Least Entries' }
];

export function AllGiveawaysFilters({
  onFiltersChange
}: AllGiveawaysFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    region: 'all',
    sortBy: 'end-date-asc'
  });

  const updateFilter = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const clearAllFilters = () => {
    const defaultFilters: FilterOptions = {
      status: 'all',
      region: 'all',
      sortBy: 'end-date-asc'
    };
    setFilters(defaultFilters);
    onFiltersChange?.(defaultFilters);
  };

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.region !== 'all' ||
    filters.sortBy !== 'end-date-asc';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <SlidersHorizontal className="h-5 w-5" />
          Filters & Sort
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Filter */}
        <div className="space-y-3">
          <Typography.Text className="font-medium text-sm">
            Status
          </Typography.Text>
          <div className="grid grid-cols-3 gap-2">
            {(['all', 'active', 'ended'] as FilterStatus[]).map((status) => (
              <Button
                key={status}
                variant={filters.status === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateFilter('status', status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Region Filter */}
        <div className="space-y-3">
          <Typography.Text className="font-medium text-sm">
            Region
          </Typography.Text>
          <Select
            value={filters.region || 'all'}
            onValueChange={(value) => updateFilter('region', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region.value} value={region.value}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Options */}
        <div className="space-y-3">
          <Typography.Text className="font-medium text-sm">
            Sort By
          </Typography.Text>
          <Select
            value={filters.sortBy}
            onValueChange={(value) =>
              updateFilter('sortBy', value as SortOption)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <Typography.Text className="font-medium text-sm flex items-center gap-1">
                <Filter className="h-3 w-3" />
                Active Filters
              </Typography.Text>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 px-2 text-xs"
              >
                Clear All
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.status !== 'all' && (
                <Badge variant="secondary" className="gap-1 capitalize">
                  {filters.status}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 hover:bg-transparent"
                    onClick={() => updateFilter('status', 'all')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}

              {filters.region !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {regions.find((r) => r.value === filters.region)?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 hover:bg-transparent"
                    onClick={() => updateFilter('region', 'all')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}

              {filters.sortBy !== 'end-date-asc' && (
                <Badge variant="secondary" className="gap-1">
                  {sortOptions.find((s) => s.value === filters.sortBy)?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 hover:bg-transparent"
                    onClick={() => updateFilter('sortBy', 'end-date-asc')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
