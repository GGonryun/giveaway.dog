'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { GiveawayFilters } from '@/lib/filters/giveaway-filters';

export function GiveawayFiltersSheet() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const currentFilters: GiveawayFilters = {
    minEntrants: searchParams.get('minEntrants')
      ? parseInt(searchParams.get('minEntrants')!)
      : undefined,
    maxEntrants: searchParams.get('maxEntrants')
      ? parseInt(searchParams.get('maxEntrants')!)
      : undefined,
    sortBy:
      (searchParams.get('sortBy') as GiveawayFilters['sortBy']) ??
      'entrants-desc'
  };

  const [filters, setFilters] = useState<GiveawayFilters>(currentFilters);

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

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    setFilters({
      sortBy: 'entrants-desc'
    });
    router.push(pathname);
    setIsOpen(false);
  };

  const hasActiveFilters =
    filters.minEntrants !== undefined ||
    filters.maxEntrants !== undefined ||
    (filters.sortBy && filters.sortBy !== 'entrants-desc');

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
