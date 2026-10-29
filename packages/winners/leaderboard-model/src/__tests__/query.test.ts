import { describe, it, expect } from 'vitest';
import { parseWinnersQuery } from '../query';

describe('parseWinnersQuery', () => {
  it('reads the page and the search of a valid query', () => {
    expect(parseWinnersQuery({ page: '12', search: 'jane' })).toEqual({
      page: 12,
      search: 'jane'
    });
  });

  it('falls back to the first page for an empty query', () => {
    expect(parseWinnersQuery({})).toEqual({ page: 1, search: undefined });
  });

  it.each([
    'abc',
    '0',
    '-2',
    '1.5',
    '2abc',
    'abc2',
    '1e2',
    ' 3',
    '',
    '99999999999999999999'
  ])('reads page %j as the first page', (page) => {
    expect(parseWinnersQuery({ page }).page).toBe(1);
  });
});
