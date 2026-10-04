'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@giveaway/ui-primitives/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@giveaway/ui-primitives/sheet';
import { Label } from '@giveaway/ui-primitives/label';
import { Input } from '@giveaway/ui-primitives/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@giveaway/ui-primitives/select';
import {
  ALL_BROWSE_STATUSES,
  BrowseStatus,
  BROWSE_STATUS_LABELS,
  GiveawayFilters
} from '@/lib/filters/giveaway-filters';
import { Checkbox } from '@giveaway/ui-primitives/checkbox';
import { Switch } from '@giveaway/ui-primitives/switch';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { useMemo } from 'react';

type BrowseHost = {
  id: string;
  name: string;
  slug: string;
};

export function GiveawayFiltersSheet({
  availableHosts = []
}: {
  availableHosts?: BrowseHost[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const parseShowStatuses = (value: string | null): BrowseStatus[] => {
    if (!value) return ALL_BROWSE_STATUSES;
    const statuses = value.split(',').filter(Boolean) as BrowseStatus[];
    return statuses.length > 0 ? statuses : ALL_BROWSE_STATUSES;
  };

  const parseHosts = (value: string | null): string[] => {
    if (!value) return [];
    const hosts = value.split(',').filter(Boolean);
    return hosts;
  };

  const hostOptions: MultiSelectOption[] = useMemo(
    () =>
      availableHosts.map((host) => ({
        label: host.name,
        value: host.slug
      })),
    [availableHosts]
  );

  const currentFilters: GiveawayFilters = {
    minEntrants: searchParams.get('minEntrants')
      ? parseInt(searchParams.get('minEntrants')!)
      : undefined,
    maxEntrants: searchParams.get('maxEntrants')
      ? parseInt(searchParams.get('maxEntrants')!)
      : undefined,
    sortBy:
      (searchParams.get('sortBy') as GiveawayFilters['sortBy']) ??
      'entrants-desc',
    search: searchParams.get('search') ?? undefined,
    showStatuses: parseShowStatuses(searchParams.get('showStatuses')),
    hideEntered: searchParams.get('hideEntered') === 'true',
    hosts: parseHosts(searchParams.get('hosts'))
  };

  const [filters, setFilters] = useState<GiveawayFilters>(currentFilters);

  useEffect(() => {
    setFilters(currentFilters);
  }, [searchParams]);

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams);

    if (filters.minEntrants !== undefined && filters.minEntrants > 0) {
      params.set('minEntrants', filters.minEntrants.toString());
    } else {
      params.delete('minEntrants');
    }

    if (filters.maxEntrants !== undefined && filters.maxEntrants > 0) {
      params.set('maxEntrants', filters.maxEntrants.toString());
    } else {
      params.delete('maxEntrants');
    }

    if (filters.sortBy && filters.sortBy !== 'entrants-desc') {
      params.set('sortBy', filters.sortBy);
    } else {
      params.delete('sortBy');
    }

    if (filters.search) {
      params.set('search', filters.search);
    } else {
      params.delete('search');
    }

    const showStatuses = filters.showStatuses ?? ALL_BROWSE_STATUSES;
    const isAllSelected = showStatuses.length === ALL_BROWSE_STATUSES.length;
    if (!isAllSelected && showStatuses.length > 0) {
      params.set('showStatuses', showStatuses.join(','));
    } else {
      params.delete('showStatuses');
    }

    if (filters.hideEntered) {
      params.set('hideEntered', 'true');
    } else {
      params.delete('hideEntered');
    }

    if (filters.hosts && filters.hosts.length > 0) {
      params.set('hosts', filters.hosts.join(','));
    } else {
      params.delete('hosts');
    }

    params.delete('page');

    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    setFilters({ sortBy: 'entrants-desc' });
    router.push(pathname);
    setIsOpen(false);
  };

  const currentShowStatuses = filters.showStatuses ?? ALL_BROWSE_STATUSES;
  const currentHosts = filters.hosts ?? [];
  const hasActiveFilters =
    filters.minEntrants !== undefined ||
    filters.maxEntrants !== undefined ||
    (filters.sortBy && filters.sortBy !== 'entrants-desc') ||
    (filters.search && filters.search !== '') ||
    currentShowStatuses.length !== ALL_BROWSE_STATUSES.length ||
    filters.hideEntered ||
    currentHosts.length > 0;

  const toggleShowStatus = (status: BrowseStatus) => {
    const current = filters.showStatuses ?? ALL_BROWSE_STATUSES;
    const newStatuses = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    setFilters({ ...filters, showStatuses: newStatuses });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-md z-50">
        <SheetHeader>
          <SheetTitle>Filter Giveaways</SheetTitle>
          <SheetDescription>
            Narrow down giveaways by entrants, sort order, and more
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4">
          <div className="space-y-3">
            <Label htmlFor="sortBy">Sort By</Label>
            <Select
              value={filters.sortBy ?? 'entrants-desc'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  sortBy: value as GiveawayFilters['sortBy']
                })
              }
            >
              <SelectTrigger id="sortBy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrants-desc">Most Entrants</SelectItem>
                <SelectItem value="entrants-asc">Fewest Entrants</SelectItem>
                <SelectItem value="ending-soon">Ending Soon</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="minEntrants">Minimum Entrants</Label>
            <Input
              id="minEntrants"
              type="number"
              min="0"
              placeholder="e.g., 100"
              value={filters.minEntrants ?? ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  minEntrants: e.target.value
                    ? parseInt(e.target.value)
                    : undefined
                })
              }
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="maxEntrants">Maximum Entrants</Label>
            <Input
              id="maxEntrants"
              type="number"
              min="0"
              placeholder="e.g., 1000"
              value={filters.maxEntrants ?? ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  maxEntrants: e.target.value
                    ? parseInt(e.target.value)
                    : undefined
                })
              }
            />
          </div>

          <div className="space-y-3">
            <Label>Show Statuses</Label>
            <div className="space-y-2">
              {ALL_BROWSE_STATUSES.map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`show-${status}`}
                    checked={currentShowStatuses.includes(status)}
                    onCheckedChange={() => toggleShowStatus(status)}
                  />
                  <Label
                    htmlFor={`show-${status}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {BROWSE_STATUS_LABELS[status]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="hideEntered" className="cursor-pointer">
              Hide participation
            </Label>
            <Switch
              id="hideEntered"
              checked={filters.hideEntered ?? false}
              onCheckedChange={(checked) =>
                setFilters({ ...filters, hideEntered: checked })
              }
            />
          </div>

          {availableHosts.length > 0 && (
            <div className="space-y-3">
              <Label>Hosts</Label>
              <MultiSelect
                options={hostOptions}
                defaultValue={currentHosts}
                onValueChange={(value) =>
                  setFilters({ ...filters, hosts: value })
                }
                placeholder="Select hosts..."
                maxCount={2}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleApplyFilters} className="flex-1">
              Apply Filters
            </Button>
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
