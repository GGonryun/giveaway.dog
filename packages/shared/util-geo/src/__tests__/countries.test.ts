import { describe, it, expect } from 'vitest';
import {
  countryOptions,
  continentOptions,
  countriesInContinent,
  isRegion,
  isContinent,
  isCountry,
  toRegion,
  expandCountries,
  includesCountryCode,
  type Country,
  type Continent
} from '../countries';
import countriesData from '../countries.json';
import { ApplicationError } from '@giveaway/util-errors';

const catchError = (fn: () => unknown): unknown => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('Expected function to throw');
};

describe('countries', () => {
  describe('countryOptions', () => {
    it('contains one option per country in the data file', () => {
      expect(countryOptions).toHaveLength(countriesData.length);
      expect(countryOptions).toHaveLength(249);
    });

    it('builds options with the Country group, the name as label and a country: prefixed value', () => {
      expect(countryOptions[0]).toEqual({
        group: 'Country',
        label: 'Afghanistan',
        value: 'country:AF'
      });
    });

    it('includes the United States', () => {
      expect(countryOptions).toContainEqual({
        group: 'Country',
        label: expect.stringContaining('United States'),
        value: 'country:US'
      });
    });

    it('has unique values', () => {
      const values = countryOptions.map((option) => option.value);

      expect(new Set(values).size).toBe(values.length);
    });

    it('uses two letter upper case codes for every value', () => {
      for (const option of countryOptions) {
        expect(option.value).toMatch(/^country:[A-Z]{2}$/);
        expect(option.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe('continentOptions', () => {
    it('contains the seven continents in data file order', () => {
      expect(continentOptions).toEqual([
        { group: 'Continent', label: 'Africa', value: 'continent:AF' },
        { group: 'Continent', label: 'Antarctica', value: 'continent:AN' },
        { group: 'Continent', label: 'Asia', value: 'continent:AS' },
        { group: 'Continent', label: 'Europe', value: 'continent:EU' },
        { group: 'Continent', label: 'North America', value: 'continent:NA' },
        { group: 'Continent', label: 'Oceania', value: 'continent:OC' },
        { group: 'Continent', label: 'South America', value: 'continent:SA' }
      ]);
    });
  });

  describe('countriesInContinent', () => {
    it('returns country regions whose continent code matches', () => {
      const europe = countriesInContinent('continent:EU');

      expect(europe).toContain('country:FR');
      expect(europe).toContain('country:DE');
      expect(europe).not.toContain('country:US');
    });

    it.each([
      ['continent:AF', 60],
      ['continent:AN', 1],
      ['continent:AS', 51],
      ['continent:EU', 51],
      ['continent:NA', 40],
      ['continent:OC', 29],
      ['continent:SA', 17]
    ] as [Continent, number][])(
      'returns %s with %i countries',
      (continent, count) => {
        expect(countriesInContinent(continent)).toHaveLength(count);
      }
    );

    it('covers every country exactly once across all continents', () => {
      const all = continentOptions.flatMap((option) =>
        countriesInContinent(option.value)
      );

      expect(all).toHaveLength(countryOptions.length);
      expect(new Set(all).size).toBe(all.length);
    });

    it('returns an empty list for an unknown continent code', () => {
      expect(countriesInContinent('continent:ZZ')).toEqual([]);
    });

    it('returns an empty list when the continent has no code', () => {
      expect(countriesInContinent('continent' as Continent)).toEqual([]);
    });
  });

  describe('isRegion', () => {
    it.each(['country:US', 'continent:EU', 'country:', 'continent:'])(
      'returns true for %s',
      (value) => {
        expect(isRegion(value)).toBe(true);
      }
    );

    it.each(['US', 'Country:US', 'region:EU', '', ' country:US'])(
      'returns false for "%s"',
      (value) => {
        expect(isRegion(value)).toBe(false);
      }
    );
  });

  describe('isContinent', () => {
    it('returns true for continent regions', () => {
      expect(isContinent('continent:EU')).toBe(true);
    });

    it('returns false for country regions', () => {
      expect(isContinent('country:EU')).toBe(false);
    });

    it('requires a colon right after the continent prefix', () => {
      expect(isContinent('continental:EU' as Continent)).toBe(false);
    });
  });

  describe('isCountry', () => {
    it('returns true for country regions', () => {
      expect(isCountry('country:US')).toBe(true);
    });

    it('returns false for continent regions', () => {
      expect(isCountry('continent:NA')).toBe(false);
    });

    it('requires a colon right after the country prefix', () => {
      expect(isCountry('countryside:US' as Country)).toBe(false);
    });
  });

  describe('toRegion', () => {
    it('returns valid country regions unchanged', () => {
      expect(toRegion('country:US')).toBe('country:US');
    });

    it('returns valid continent regions unchanged', () => {
      expect(toRegion('continent:AS')).toBe('continent:AS');
    });

    it('does not validate that the code exists', () => {
      expect(toRegion('country:NOPE')).toBe('country:NOPE');
    });

    it('throws a BAD_REQUEST application error for invalid regions', () => {
      const error = catchError(() => toRegion('US'));

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Invalid region: US'
      });
    });
  });

  describe('expandCountries', () => {
    it('returns an empty list for no regions', () => {
      expect(expandCountries([])).toEqual([]);
    });

    it('keeps country regions as they are', () => {
      expect(expandCountries(['country:US', 'country:CA'])).toEqual([
        'country:US',
        'country:CA'
      ]);
    });

    it('expands continents into their countries', () => {
      expect(expandCountries(['continent:AN'])).toEqual(
        countriesInContinent('continent:AN')
      );
    });

    it('expands mixed regions in input order', () => {
      const result = expandCountries(['country:US', 'continent:SA']);

      expect(result[0]).toBe('country:US');
      expect(result.slice(1)).toEqual(countriesInContinent('continent:SA'));
    });

    it('keeps duplicates when a country is listed alongside its continent', () => {
      const result = expandCountries(['country:FR', 'continent:EU']);

      expect(result.filter((country) => country === 'country:FR')).toHaveLength(
        2
      );
    });

    it('throws when any region is invalid', () => {
      const error = catchError(() => expandCountries(['country:US', 'mars']));

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Invalid region: mars'
      });
    });
  });

  describe('includesCountryCode', () => {
    const countries: Country[] = ['country:US', 'country:CA'];

    it('returns true when the country code is in the list', () => {
      expect(includesCountryCode(countries, 'CA')).toBe(true);
    });

    it('returns false when the country code is not in the list', () => {
      expect(includesCountryCode(countries, 'MX')).toBe(false);
    });

    it('is case sensitive', () => {
      expect(includesCountryCode(countries, 'us')).toBe(false);
    });

    it('returns false for a null country code', () => {
      expect(includesCountryCode(countries, null)).toBe(false);
    });

    it('returns false for an empty country code', () => {
      expect(includesCountryCode(['country:' as Country], '')).toBe(false);
    });

    it('returns false for an empty list', () => {
      expect(includesCountryCode([], 'US')).toBe(false);
    });
  });
});
