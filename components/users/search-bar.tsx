'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
}

export const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search users...',
  suggestions = [],
  onSuggestionSelect
}: SearchBarProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      setShowSuggestions(newValue.length > 0 && suggestions.length > 0);
    },
    [onChange, suggestions.length]
  );

  const handleClear = useCallback(() => {
    onChange('');
    setShowSuggestions(false);
  }, [onChange]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      onChange(suggestion);
      setShowSuggestions(false);
      onSuggestionSelect?.(suggestion);
    },
    [onChange, onSuggestionSelect]
  );

  const filteredSuggestions = suggestions
    .filter(
      (suggestion) =>
        suggestion.toLowerCase().includes(value.toLowerCase()) &&
        suggestion.toLowerCase() !== value.toLowerCase()
    )
    .slice(0, 5);

  const isSearchActive = value.length > 0;

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() =>
            setShowSuggestions(
              value.length > 0 && filteredSuggestions.length > 0
            )
          }
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
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
    </div>
  );
};
