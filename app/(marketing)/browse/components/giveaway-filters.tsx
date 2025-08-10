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
import { Filter, X, XIcon } from 'lucide-react';

interface FilterOptions {
  region: string | null;
  status: string | null;
}

const regions = [
  { value: 'worldwide', label: 'Worldwide' },
  { value: 'north-america', label: 'North America' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia', label: 'Asia' },
  { value: 'oceania', label: 'Oceania' },
  { value: 'south-america', label: 'South America' },
  { value: 'africa', label: 'Africa' }
];

const statuses = [
  { value: 'active', label: 'Active' },
  { value: 'new', label: 'New' },
  { value: 'newest', label: 'Newest' },
  { value: 'ending-soon', label: 'Ending Soon' },
  { value: 'ended', label: 'Ended' }
];

export function GiveawayFilters() {
  const [filters, setFilters] = useState<FilterOptions>({
    region: 'worldwide',
    status: 'active'
  });

  const updateFilter = (key: keyof FilterOptions, value: string | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      region: 'worldwide',
      status: 'active'
    });
  };

  const hasActiveFilters =
    filters.region !== 'worldwide' || filters.status !== 'active';
  const activeFilterCount =
    (filters.region !== 'worldwide' ? 1 : 0) +
    (filters.status !== 'active' ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={clearAllFilters}
          disabled={!hasActiveFilters}
          className="whitespace-nowrap"
        >
          <XIcon />
          Reset Filters
        </Button>

        <Select
          value={filters.region || ''}
          onValueChange={(value) => updateFilter('region', value || null)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            {regions.map((region) => (
              <SelectItem key={region.value} value={region.value}>
                {region.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status || ''}
          onValueChange={(value) => updateFilter('status', value || null)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Display - Always show with empty state */}
      <div className="flex flex-wrap gap-2 items-center min-h-[32px]">
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {hasActiveFilters ? 'Active filters:' : 'No active filters'}
          </span>
        </div>

        {hasActiveFilters ? (
          <>
            {filters.region && filters.region !== 'worldwide' && (
              <Badge variant="secondary" className="gap-1">
                {regions.find((r) => r.value === filters.region)?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => updateFilter('region', 'worldwide')}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}

            {filters.status && filters.status !== 'active' && (
              <Badge variant="secondary" className="gap-1">
                {statuses.find((s) => s.value === filters.status)?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => updateFilter('status', 'active')}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
          </>
        ) : (
          <span className="text-sm text-muted-foreground italic">
            Showing all giveaways with default filters
          </span>
        )}
      </div>
    </div>
  );
}
