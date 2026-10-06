import { describe, it, expect } from 'vitest';
import { UserSource } from '@giveaway/db-model';
import { parseUsersSearchParams } from '../parse-search-params';

const DEFAULTS = {
  page: 1,
  pageSize: 50,
  search: undefined,
  sources: undefined,
  minQualityScore: undefined,
  maxQualityScore: undefined,
  sortBy: 'lastEntry',
  sortDirection: 'desc'
};

describe('parseUsersSearchParams', () => {
  describe('when no parameters are provided', () => {
    it('returns the default paging and sorting', () => {
      expect(parseUsersSearchParams({})).toEqual(DEFAULTS);
    });
  });

  describe('when every parameter is provided', () => {
    it('parses each value into its typed form', () => {
      expect(
        parseUsersSearchParams({
          page: '3',
          pageSize: '25',
          search: 'alice',
          sources: 'SIGNUP,TWITTER_IMPORT',
          minQualityScore: '10',
          maxQualityScore: '90',
          sortBy: 'qualityScore',
          sortDirection: 'asc'
        })
      ).toEqual({
        page: 3,
        pageSize: 25,
        search: 'alice',
        sources: [UserSource.SIGNUP, UserSource.TWITTER_IMPORT],
        minQualityScore: 10,
        maxQualityScore: 90,
        sortBy: 'qualityScore',
        sortDirection: 'asc'
      });
    });
  });

  describe('when a key is repeated', () => {
    it('uses the first value of each repeated key', () => {
      expect(
        parseUsersSearchParams({
          page: ['2', '5'],
          pageSize: ['10', '20'],
          search: ['bob', 'carol'],
          sources: ['MANUAL_IMPORT', 'SIGNUP'],
          minQualityScore: ['5', '6'],
          maxQualityScore: ['70', '80'],
          sortBy: ['name', 'qualityScore'],
          sortDirection: ['asc', 'desc']
        })
      ).toEqual({
        page: 2,
        pageSize: 10,
        search: 'bob',
        sources: [UserSource.MANUAL_IMPORT],
        minQualityScore: 5,
        maxQualityScore: 70,
        sortBy: 'name',
        sortDirection: 'asc'
      });
    });

    it('returns the defaults for empty arrays', () => {
      expect(
        parseUsersSearchParams({
          page: [],
          pageSize: [],
          search: [],
          sources: [],
          minQualityScore: [],
          maxQualityScore: [],
          sortBy: [],
          sortDirection: []
        })
      ).toEqual(DEFAULTS);
    });
  });

  describe('page', () => {
    it('keeps a large page number', () => {
      expect(parseUsersSearchParams({ page: '1000000' }).page).toBe(1000000);
    });

    it.each(['', '0', '-2', '2.9', '4abc', 'abc', '0x1A', ' 12', '1e3'])(
      'falls back to 1 for %j',
      (page) => {
        expect(parseUsersSearchParams({ page }).page).toBe(1);
      }
    );

    it('falls back to 1 above the largest safe integer', () => {
      expect(parseUsersSearchParams({ page: '9007199254740993' }).page).toBe(1);
    });
  });

  describe('pageSize', () => {
    it.each([
      ['1', 1],
      ['100', 100]
    ])('keeps the bound %s', (pageSize, expected) => {
      expect(parseUsersSearchParams({ pageSize }).pageSize).toBe(expected);
    });

    it.each(['', '0', '101', '100000', '1000000000', 'all', '-5', '7.9'])(
      'falls back to 50 for the out of range or invalid value %j',
      (pageSize) => {
        expect(parseUsersSearchParams({ pageSize }).pageSize).toBe(50);
      }
    );
  });

  describe('search', () => {
    it('returns undefined for an empty search string', () => {
      expect(parseUsersSearchParams({ search: '' }).search).toBeUndefined();
    });

    it('does not trim the search string', () => {
      expect(parseUsersSearchParams({ search: '  bob ' }).search).toBe(
        '  bob '
      );
    });
  });

  describe('sources', () => {
    it('splits a single source into a one-element list', () => {
      expect(parseUsersSearchParams({ sources: 'ANONYMOUS' }).sources).toEqual([
        UserSource.ANONYMOUS
      ]);
    });

    it('returns undefined for an empty string', () => {
      expect(parseUsersSearchParams({ sources: '' }).sources).toBeUndefined();
    });

    it('drops sources with surrounding whitespace', () => {
      expect(
        parseUsersSearchParams({ sources: 'SIGNUP, MANUAL_IMPORT' }).sources
      ).toEqual([UserSource.SIGNUP]);
    });

    it('returns undefined when no source is known', () => {
      expect(
        parseUsersSearchParams({ sources: 'BOGUS,signup' }).sources
      ).toBeUndefined();
    });

    it('drops unknown and empty entries', () => {
      expect(
        parseUsersSearchParams({ sources: 'SIGNUP,,BOGUS,DISCORD_IMPORT,' })
          .sources
      ).toEqual([UserSource.SIGNUP, UserSource.DISCORD_IMPORT]);
    });

    it('removes duplicate sources', () => {
      expect(
        parseUsersSearchParams({ sources: 'SIGNUP,ANONYMOUS,SIGNUP' }).sources
      ).toEqual([UserSource.SIGNUP, UserSource.ANONYMOUS]);
    });
  });

  describe('quality score bounds', () => {
    it.each(['minQualityScore', 'maxQualityScore'] as const)(
      'keeps 0 and 100 as %s',
      (field) => {
        expect(parseUsersSearchParams({ [field]: '0' })[field]).toBe(0);
        expect(parseUsersSearchParams({ [field]: '100' })[field]).toBe(100);
      }
    );

    it.each(['', '101', '-1', '7.9', 'low', '0x1A', ' 12'])(
      'returns undefined for the out of range or invalid bound %j',
      (value) => {
        const parsed = parseUsersSearchParams({
          minQualityScore: value,
          maxQualityScore: value
        });

        expect(parsed.minQualityScore).toBeUndefined();
        expect(parsed.maxQualityScore).toBeUndefined();
      }
    );

    it('does not reorder a minimum above the maximum', () => {
      const parsed = parseUsersSearchParams({
        minQualityScore: '80',
        maxQualityScore: '20'
      });

      expect(parsed.minQualityScore).toBe(80);
      expect(parsed.maxQualityScore).toBe(20);
    });
  });

  describe('sorting', () => {
    it.each(['lastEntry', 'qualityScore', 'name'] as const)(
      'keeps the %s sort field',
      (sortBy) => {
        expect(parseUsersSearchParams({ sortBy }).sortBy).toBe(sortBy);
      }
    );

    it('keeps an ascending sort direction', () => {
      expect(
        parseUsersSearchParams({ sortDirection: 'asc' }).sortDirection
      ).toBe('asc');
    });

    it('falls back to the defaults for unknown sort values', () => {
      const parsed = parseUsersSearchParams({
        sortBy: 'email',
        sortDirection: 'ASC'
      });

      expect(parsed.sortBy).toBe('lastEntry');
      expect(parsed.sortDirection).toBe('desc');
    });

    it('falls back to the defaults for empty sort values', () => {
      const parsed = parseUsersSearchParams({
        sortBy: '',
        sortDirection: ''
      });

      expect(parsed.sortBy).toBe('lastEntry');
      expect(parsed.sortDirection).toBe('desc');
    });
  });
});
