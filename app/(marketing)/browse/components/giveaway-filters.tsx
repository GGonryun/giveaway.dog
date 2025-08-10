'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';

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
  { value: 'new', label: 'New' },
  { value: 'ending-soon', label: 'Ending Soon' },
  { value: 'active', label: 'Active' }
];


export function GiveawayFilters() {
  const [filters, setFilters] = useState<FilterOptions>({
    region: null,
    status: null
  });

  const updateFilter = (key: keyof FilterOptions, value: string | null) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilter = (key: keyof FilterOptions) => {
    updateFilter(key, null);
  };

  const clearAllFilters = () => {
    setFilters({
      region: null,
      status: null
    });
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter !== null);
  const activeFilterCount = Object.values(filters).filter(filter => filter !== null).length;

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filters.region || ''} onValueChange={(value) => updateFilter('region', value || null)}>
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

        <Select value={filters.status || ''} onValueChange={(value) => updateFilter('status', value || null)}>
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


        {hasActiveFilters && (
          <Button 
            variant="outline" 
            onClick={clearAllFilters}
            className="whitespace-nowrap"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Active filters:</span>
          </div>
          
          {filters.region && (
            <Badge variant="secondary" className="gap-1">
              {regions.find(r => r.value === filters.region)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => clearFilter('region')}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
          
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              {statuses.find(s => s.value === filters.status)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => clearFilter('status')}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
          
        </div>
      )}
    </div>
  );
}