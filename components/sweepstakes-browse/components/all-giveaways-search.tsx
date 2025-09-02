'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface AllGiveawaysSearchProps {
  onSearch?: (query: string) => void;
  onClear?: () => void;
}

export function AllGiveawaysSearch({
  onSearch,
  onClear
}: AllGiveawaysSearchProps) {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  const handleClear = () => {
    setQuery('');
    onClear?.();
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="search"
          placeholder="Search giveaways by name or description..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-20"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button type="submit" size="sm" className="h-6 px-2">
            Search
          </Button>
        </div>
      </div>
    </form>
  );
}
