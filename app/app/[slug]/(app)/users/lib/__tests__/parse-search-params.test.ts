import { describe, it, expect } from 'vitest';
import { UserSource } from '@prisma/client';
import {
  parseUsersSearchParams,
  type UsersSearchParams
} from '../parse-search-params';

describe('parseUsersSearchParams', () => {
  describe('when no parameters are provided', () => {
    it('returns the default paging and sorting', () => {
      expect(parseUsersSearchParams({})).toEqual({
        page: 1,
        pageSize: 50,
        search: undefined,
        sources: undefined,
        minQualityScore: undefined,
        maxQualityScore: undefined,
        sortBy: 'lastEntry',
        sortDirection: 'desc'
      });
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

  describe('page', () => {
    it('falls back to 1 for an empty string', () => {
      expect(parseUsersSearchParams({ page: '' }).page).toBe(1);
    });

    it('parses zero rather than falling back', () => {
      expect(parseUsersSearchParams({ page: '0' }).page).toBe(0);
    });

    it('keeps negative values', () => {
      expect(parseUsersSearchParams({ page: '-2' }).page).toBe(-2);
    });

    it('truncates decimal values', () => {
      expect(parseUsersSearchParams({ page: '2.9' }).page).toBe(2);
    });

    it('parses a leading integer and ignores trailing text', () => {
      expect(parseUsersSearchParams({ page: '4abc' }).page).toBe(4);
    });

    it('returns NaN for non-numeric input', () => {
      expect(parseUsersSearchParams({ page: 'abc' }).page).toBeNaN();
    });
  });

  describe('pageSize', () => {
    it('falls back to 50 for an empty string', () => {
      expect(parseUsersSearchParams({ pageSize: '' }).pageSize).toBe(50);
    });

    it('does not clamp large values', () => {
      expect(parseUsersSearchParams({ pageSize: '100000' }).pageSize).toBe(
        100000
      );
    });

    it('returns NaN for non-numeric input', () => {
      expect(parseUsersSearchParams({ pageSize: 'all' }).pageSize).toBeNaN();
    });
  });

  describe('search', () => {
    it('passes an empty search string through unchanged', () => {
      expect(parseUsersSearchParams({ search: '' }).search).toBe('');
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

    it('does not trim whitespace around sources', () => {
      expect(
        parseUsersSearchParams({ sources: 'SIGNUP, MANUAL_IMPORT' }).sources
      ).toEqual(['SIGNUP', ' MANUAL_IMPORT']);
    });

    it('does not validate unknown source names', () => {
      expect(parseUsersSearchParams({ sources: 'BOGUS' }).sources).toEqual([
        'BOGUS'
      ]);
    });

    it('keeps empty entries from consecutive commas', () => {
      expect(parseUsersSearchParams({ sources: 'SIGNUP,,' }).sources).toEqual([
        'SIGNUP',
        '',
        ''
      ]);
    });
  });

  describe('quality score bounds', () => {
    it('parses zero as a minimum quality score', () => {
      expect(
        parseUsersSearchParams({ minQualityScore: '0' }).minQualityScore
      ).toBe(0);
    });

    it('parses zero as a maximum quality score', () => {
      expect(
        parseUsersSearchParams({ maxQualityScore: '0' }).maxQualityScore
      ).toBe(0);
    });

    it('returns undefined for empty bounds', () => {
      const parsed = parseUsersSearchParams({
        minQualityScore: '',
        maxQualityScore: ''
      });

      expect(parsed.minQualityScore).toBeUndefined();
      expect(parsed.maxQualityScore).toBeUndefined();
    });

    it('does not reorder a minimum above the maximum', () => {
      const parsed = parseUsersSearchParams({
        minQualityScore: '80',
        maxQualityScore: '20'
      });

      expect(parsed.minQualityScore).toBe(80);
      expect(parsed.maxQualityScore).toBe(20);
    });

    it('returns NaN for non-numeric bounds', () => {
      const parsed = parseUsersSearchParams({
        minQualityScore: 'low',
        maxQualityScore: 'high'
      });

      expect(parsed.minQualityScore).toBeNaN();
      expect(parsed.maxQualityScore).toBeNaN();
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

    it('passes an unknown sort field through unchanged', () => {
      const params = { sortBy: 'email' } as unknown as UsersSearchParams;

      expect(parseUsersSearchParams(params).sortBy).toBe('email');
    });

    it('falls back to the defaults for empty sort values', () => {
      const params = {
        sortBy: '',
        sortDirection: ''
      } as unknown as UsersSearchParams;

      const parsed = parseUsersSearchParams(params);

      expect(parsed.sortBy).toBe('lastEntry');
      expect(parsed.sortDirection).toBe('desc');
    });
  });
});
