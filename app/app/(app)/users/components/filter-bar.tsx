'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Filter,
  X,
  Calendar,
  BarChart3,
  Users,
  MapPin,
  RefreshCcw
} from 'lucide-react';

interface FilterBarProps {
  filters: {
    query: string;
    minScore: number;
    maxScore: number;
    status: string;
    dateRange: string;
    source: string;
  };
  onChange: (filters: FilterBarProps['filters']) => void;
}

export const FilterBar = ({ filters, onChange }: FilterBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const scoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateLocalFilter = (key: keyof FilterBarProps['filters'], value: string | number) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const updateScoreRange = useCallback((min: number, max: number) => {
    setLocalFilters(prev => ({ ...prev, minScore: min, maxScore: max }));
  }, []);

  const handleApply = () => {
    onChange(localFilters);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setLocalFilters(filters); // Reset to original values
    setIsOpen(false);
  };

  const resetLocalFilters = () => {
    const defaultFilters = {
      query: '',
      minScore: 0,
      maxScore: 100,
      status: 'all',
      dateRange: 'all',
      source: 'all'
    };
    setLocalFilters(defaultFilters);
  };

  // Sync local state when dialog opens or filters change externally
  React.useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (scoreTimeoutRef.current) {
        clearTimeout(scoreTimeoutRef.current);
      }
    };
  }, []);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.minScore > 0 || filters.maxScore < 100) count++;
    if (filters.status !== 'all') count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.source !== 'all') count++;
    return count;
  };

  const getLocalActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.minScore > 0 || localFilters.maxScore < 100) count++;
    if (localFilters.status !== 'all') count++;
    if (localFilters.dateRange !== 'all') count++;
    if (localFilters.source !== 'all') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="h-4 w-4 mr-1" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-[80vh] overflow-y-auto" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filters</h4>
            <Button variant="ghost" size="sm" onClick={resetLocalFilters} className="relative">
              <RefreshCcw className="h-4 w-4 mr-1" />
              Reset
              {getLocalActiveFiltersCount() > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                  {getLocalActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </div>

          <Separator className="my-2" />

          {/* Quality Score Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-1" />
              Quality Score: {localFilters.minScore} - {localFilters.maxScore}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Min</label>
                <Slider
                  value={[localFilters.minScore]}
                  onValueChange={([value]: number[]) => updateScoreRange(value, localFilters.maxScore)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Max</label>
                <Slider
                  value={[localFilters.maxScore]}
                  onValueChange={([value]: number[]) => updateScoreRange(localFilters.minScore, value)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Other Filters - Compact */}
          <div className="space-y-3">
            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Status
              </label>
              <Select value={localFilters.status} onValueChange={(value) => updateLocalFilter('status', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="trusted">Trusted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-1">
              <label className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Date Range
              </label>
              <Select value={localFilters.dateRange} onValueChange={(value) => updateLocalFilter('dateRange', value)}>
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

            {/* Source Filter */}
            <div className="space-y-1">
              <label className="text-sm font-medium flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Source
              </label>
              <Select value={localFilters.source} onValueChange={(value) => updateLocalFilter('source', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="twitter">Twitter/X</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="my-3" />

          {/* Apply/Cancel Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApply}>
              Apply {getLocalActiveFiltersCount() > 0 ? `(${getLocalActiveFiltersCount()})` : ''}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};