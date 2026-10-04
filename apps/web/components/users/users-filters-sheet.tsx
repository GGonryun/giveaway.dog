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
import { Checkbox } from '@giveaway/ui-primitives/checkbox';
import { UserSource } from '@prisma/client';
import { ScrollArea } from '@giveaway/ui-primitives/scroll-area';

interface UsersFilters {
  sources?: UserSource[];
  minQualityScore?: number;
  maxQualityScore?: number;
}

const USER_SOURCE_LABELS: Record<UserSource, string> = {
  SIGNUP: 'Sign Up',
  ANONYMOUS: 'Anonymous',
  TWITTER_IMPORT: 'Twitter Import',
  BLUESKY_IMPORT: 'Bluesky Import',
  MANUAL_IMPORT: 'Manual Import',
  DISCORD_IMPORT: 'Discord Import',
  TWITCH_IMPORT: 'Twitch Import'
};

export function UsersFiltersSheet() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const sourcesParam = searchParams.get('sources');
  const currentFilters: UsersFilters = {
    sources: sourcesParam
      ? (sourcesParam.split(',') as UserSource[])
      : undefined,
    minQualityScore: searchParams.get('minQualityScore')
      ? parseInt(searchParams.get('minQualityScore')!)
      : undefined,
    maxQualityScore: searchParams.get('maxQualityScore')
      ? parseInt(searchParams.get('maxQualityScore')!)
      : undefined
  };

  const [filters, setFilters] = useState<UsersFilters>(currentFilters);

  useEffect(() => {
    setFilters(currentFilters);
  }, [searchParams]);

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete('sources');
    params.delete('minQualityScore');
    params.delete('maxQualityScore');
    params.delete('page');

    if (filters.sources && filters.sources.length > 0) {
      params.set('sources', filters.sources.join(','));
    }

    if (filters.minQualityScore !== undefined && filters.minQualityScore > 0) {
      params.set('minQualityScore', filters.minQualityScore.toString());
    }

    if (
      filters.maxQualityScore !== undefined &&
      filters.maxQualityScore < 100
    ) {
      params.set('maxQualityScore', filters.maxQualityScore.toString());
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: UsersFilters = {};
    setFilters(clearedFilters);

    const params = new URLSearchParams(searchParams.toString());
    params.delete('sources');
    params.delete('minQualityScore');
    params.delete('maxQualityScore');
    params.delete('page');

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
    setIsOpen(false);
  };

  const toggleSource = (source: UserSource) => {
    const currentSources = filters.sources || [];
    const newSources = currentSources.includes(source)
      ? currentSources.filter((s) => s !== source)
      : [...currentSources, source];

    setFilters({
      ...filters,
      sources: newSources.length > 0 ? newSources : undefined
    });
  };

  const hasActiveFilters =
    (filters.sources && filters.sources.length > 0) ||
    filters.minQualityScore !== undefined ||
    filters.maxQualityScore !== undefined;

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
      <SheetContent side="left" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Filter Users</SheetTitle>
          <SheetDescription>
            Filter users by source, quality score, and more
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>User Source</Label>
              <div className="space-y-2">
                {(Object.keys(USER_SOURCE_LABELS) as UserSource[]).map(
                  (source) => (
                    <div key={source} className="flex items-center space-x-2">
                      <Checkbox
                        id={`source-${source}`}
                        checked={filters.sources?.includes(source) ?? false}
                        onCheckedChange={() => toggleSource(source)}
                      />
                      <label
                        htmlFor={`source-${source}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {USER_SOURCE_LABELS[source]}
                      </label>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="minQualityScore">Minimum Quality Score</Label>
              <Input
                id="minQualityScore"
                type="number"
                min="0"
                max="100"
                placeholder="e.g., 50"
                value={filters.minQualityScore ?? ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    minQualityScore: e.target.value
                      ? parseInt(e.target.value)
                      : undefined
                  })
                }
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="maxQualityScore">Maximum Quality Score</Label>
              <Input
                id="maxQualityScore"
                type="number"
                min="0"
                max="100"
                placeholder="e.g., 100"
                value={filters.maxQualityScore ?? ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    maxQualityScore: e.target.value
                      ? parseInt(e.target.value)
                      : undefined
                  })
                }
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-3 p-4 border-t">
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
      </SheetContent>
    </Sheet>
  );
}
