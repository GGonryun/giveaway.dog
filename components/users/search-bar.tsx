'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
}

export const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search users...',
  debounceMs = 150,
  suggestions = [],
  onSuggestionSelect
}: SearchBarProps) => {
  const [localValue, setLocalValue] = useState(value);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs]);

  // Update parent when debounced value changes
  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      setShowSuggestions(newValue.length > 0 && suggestions.length > 0);
    },
    [suggestions.length]
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    setDebouncedValue('');
    onChange('');
    setShowSuggestions(false);
  }, [onChange]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setLocalValue(suggestion);
      setDebouncedValue(suggestion);
      onChange(suggestion);
      setShowSuggestions(false);
      onSuggestionSelect?.(suggestion);
    },
    [onChange, onSuggestionSelect]
  );

  const filteredSuggestions = suggestions
    .filter(
      (suggestion) =>
        suggestion.toLowerCase().includes(localValue.toLowerCase()) &&
        suggestion.toLowerCase() !== localValue.toLowerCase()
    )
    .slice(0, 5); // Limit to 5 suggestions

  const isSearchActive = localValue.length > 0;
  const hasResults = debouncedValue === localValue && localValue.length > 0;

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={localValue}
          onChange={handleInputChange}
          onFocus={() =>
            setShowSuggestions(
              localValue.length > 0 && filteredSuggestions.length > 0
            )
          }
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} // Delay to allow suggestion clicks
          className="pl-9 pr-9"
        />
        {isSearchActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted rounded"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Status */}
      {hasResults && (
        <div className="flex items-center mt-2 space-x-2">
          <Badge variant="outline" className="text-xs">
            Searching: "{debouncedValue}"
          </Badge>
          {debouncedValue !== localValue && (
            <Badge variant="secondary" className="text-xs animate-pulse">
              Typing...
            </Badge>
          )}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg">
          <div className="p-2">
            <div className="text-xs text-muted-foreground mb-2 px-2">
              Suggestions
            </div>
            <div className="space-y-1">
              {filteredSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full justify-start px-2 py-1.5 h-auto text-sm hover:bg-muted rounded text-foreground"
                >
                  <div className="flex items-center space-x-2">
                    <Search className="h-3 w-3 text-muted-foreground" />
                    <span>{suggestion}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Search Tips */}
      {isSearchActive && localValue.length >= 2 && (
        <div className="mt-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-2">
            <span>Tips:</span>
            <Badge variant="outline" className="text-xs">
              @email.com
            </Badge>
            <Badge variant="outline" className="text-xs">
              user:name
            </Badge>
            <Badge variant="outline" className="text-xs">
              id:123
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};
