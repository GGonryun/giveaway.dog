'use client';

import { useSweepstakesPage } from '@/components/sweepstakes/use-sweepstakes-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ListSweepstakesFilters } from '@/schemas/sweepstakes';
import { CalendarIcon, SearchIcon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// Search and Filter Components
export const SweepstakesFilterBar: React.FC<{
  filters: ListSweepstakesFilters;
}> = ({ filters }) => {
  const page = useSweepstakesPage();

  const handleChange = useCallback(
    (value?: string) =>
      page.updateParams((params) => {
        if (value) {
          params.set('search', value);
        } else {
          params.delete('search');
        }
      }),
    [page.updateParams]
  );
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <SweepstakesSearchBar
        value={filters.search}
        onChange={handleChange}
        placeholder="Search sweepstakes by title, prize, status..."
      />

      <Select
        value={filters.dateRange}
        onValueChange={(value) =>
          page.updateParams((params) => {
            if (value) {
              params.set('dateRange', value);
            } else {
              params.delete('dateRange');
            }
          })
        }
      >
        <SelectTrigger className="hidden sm:w-48 sm:flex">
          <CalendarIcon className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Date range" />
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
  );
};
const SweepstakesSearchBar = ({
  value,
  onChange,
  placeholder = 'Search sweepstakes...'
}: {
  value?: string;
  onChange: (value?: string) => void;
  placeholder?: string;
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className="relative flex-1">
      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
          <XIcon className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};
