import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { MapPin, ChevronsUpDown, Check, Loader2 } from 'lucide-react';
import { countryOptions } from '@/lib/countries';

interface CountrySelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  hideLabel?: boolean;
  placeholder?: string;
  className?: string;
}

export function CountrySelector({
  value,
  hideLabel,
  onValueChange,
  label = 'Country',
  placeholder = 'Search for your country...',
  className
}: CountrySelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState(
    countryOptions.slice(0, 10)
  );

  // Debounced country search
  const debouncedCountrySearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (searchQuery: string) => {
        clearTimeout(timeoutId);
        setIsSearching(true);
        timeoutId = setTimeout(() => {
          const filtered = searchQuery
            ? countryOptions
                .filter((country) => {
                  const query = searchQuery.toLowerCase().trim();
                  const label = country.label?.toLowerCase() || '';
                  const value = country.value?.toLowerCase() || '';
                  return label.includes(query) || value.includes(query);
                })
                .slice(0, 50) // Limit to 50 results for performance
            : countryOptions.slice(0, 10); // Show first 10 by default
          setFilteredCountries(filtered);
          setIsSearching(false);
        }, 300); // 300ms debounce for search
      };
    })(),
    []
  );

  const handleSelect = (countryCode: string) => {
    onValueChange(countryCode);
    setOpen(false);
  };

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    debouncedCountrySearch(searchQuery);
  };

  // Reset search when popover opens
  useEffect(() => {
    if (open && query === '') {
      setFilteredCountries(countryOptions.slice(0, 10));
    }
  }, [open, query]);

  const selectedCountry = value
    ? countryOptions.find((country) => country.value === value)
    : null;

  return (
    <div className={`space-y-2 ${className}`}>
      {!hideLabel && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between w-full h-auto px-3 py-2"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span
                className="text-left truncate"
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {selectedCountry ? selectedCountry.label : placeholder}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search countries..."
              value={query}
              onValueChange={handleSearch}
            />
            <CommandList>
              {isSearching && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Searching...
                  </span>
                </div>
              )}
              {!isSearching && (
                <>
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    {filteredCountries.map((country) => (
                      <CommandItem
                        key={country.value}
                        value={country.value}
                        onSelect={() => handleSelect(country.value)}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            value === country.value
                              ? 'opacity-100'
                              : 'opacity-0'
                          }`}
                        />
                        {country.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
