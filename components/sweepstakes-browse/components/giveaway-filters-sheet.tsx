'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { GiveawayFilters } from '@/lib/filters/giveaway-filters';

const FILTERS_COOKIE_NAME = 'giveaway-filters';

const getFiltersFromCookie = (): Partial<GiveawayFilters> => {
  if (typeof document === 'undefined') return {};
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${FILTERS_COOKIE_NAME}=`));
  if (!cookie) return {};
  try {
    return JSON.parse(decodeURIComponent(cookie.split('=')[1]));
  } catch {
    return {};
  }
};

const saveFiltersToCookie = (filters: GiveawayFilters) => {
  if (typeof document === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  document.cookie = `${FILTERS_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(filters))}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

export function GiveawayFiltersSheet() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const cookieFilters = getFiltersFromCookie();

  const currentFilters: GiveawayFilters = {
    minEntrants: searchParams.get('minEntrants')
      ? parseInt(searchParams.get('minEntrants')!)
      : cookieFilters.minEntrants,
    maxEntrants: searchParams.get('maxEntrants')
      ? parseInt(searchParams.get('maxEntrants')!)
      : cookieFilters.maxEntrants,
    sortBy:
      (searchParams.get('sortBy') as GiveawayFilters['sortBy']) ??
      cookieFilters.sortBy ??
      'entrants-desc',
    hideCompleted: searchParams.get('hideCompleted')
      ? searchParams.get('hideCompleted') === 'true'
      : (cookieFilters.hideCompleted ?? false)
  };

  const [filters, setFilters] = useState<GiveawayFilters>(currentFilters);

  useEffect(() => {
    setFilters(currentFilters);
  }, [searchParams]);

  const handleApplyFilters = () => {
    const params = new URLSearchParams();

    if (filters.minEntrants !== undefined && filters.minEntrants > 0) {
      params.set('minEntrants', filters.minEntrants.toString());
    }

    if (filters.maxEntrants !== undefined && filters.maxEntrants > 0) {
      params.set('maxEntrants', filters.maxEntrants.toString());
    }

    if (filters.sortBy && filters.sortBy !== 'entrants-desc') {
      params.set('sortBy', filters.sortBy);
    }

    if (filters.hideCompleted) {
      params.set('hideCompleted', 'true');
    }

    saveFiltersToCookie(filters);

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      sortBy: 'entrants-desc' as const,
      hideCompleted: false
    };
    setFilters(clearedFilters);
    saveFiltersToCookie(clearedFilters);
    router.push(pathname);
    setIsOpen(false);
  };

  const hasActiveFilters =
    filters.minEntrants !== undefined ||
    filters.maxEntrants !== undefined ||
    (filters.sortBy && filters.sortBy !== 'entrants-desc') ||
    filters.hideCompleted === true;

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
      <SheetContent side="left" className="w-full sm:max-w-md">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="hideCompleted" className="cursor-pointer">
                Hide Completed Giveaways
              </Label>
              <Switch
                id="hideCompleted"
                checked={filters.hideCompleted ?? false}
                onCheckedChange={(checked) =>
                  setFilters({
                    ...filters,
                    hideCompleted: checked
                  })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Hide giveaways where you've completed all entry tasks
            </p>
          </div>

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
