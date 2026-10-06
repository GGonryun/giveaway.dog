import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { UserSource } from '@giveaway/db-model';
import { teamParticipantsQuerySchema } from '@giveaway/participant-model/schemas';
import { assertProperty } from '@giveaway/testing-server/property';
import {
  parseUsersSearchParams,
  type ParsedUsersParams,
  type UsersSearchParams
} from '../parse-search-params';

const KEYS = [
  'page',
  'pageSize',
  'search',
  'sources',
  'minQualityScore',
  'maxQualityScore',
  'sortBy',
  'sortDirection'
] as const;

const SORT_BY = ['lastEntry', 'qualityScore', 'name'] as const;

const SORT_DIRECTIONS = ['asc', 'desc'] as const;

const DEFAULTS: ParsedUsersParams = {
  page: 1,
  pageSize: 50,
  search: undefined,
  sources: undefined,
  minQualityScore: undefined,
  maxQualityScore: undefined,
  sortBy: 'lastEntry',
  sortDirection: 'desc'
};

const anyString = fc.oneof(fc.string(), fc.string({ unit: 'binary' }));

const sourceList = fc
  .array(
    fc.oneof(
      fc.constantFrom(...Object.values(UserSource)),
      anyString,
      fc.constantFrom('', ' SIGNUP', 'signup', 'SIGNUP ')
    ),
    { maxLength: 6 }
  )
  .map((parts) => parts.join(','));

const paramValue = fc.oneof(
  anyString,
  fc.integer().map(String),
  fc.integer({ min: -2, max: 102 }).map(String),
  fc.bigInt().map(String),
  fc.double().map(String),
  fc.constantFrom('0x1A', '1e3', ' 12', '12 ', '007', '+5', '-0', 'NaN'),
  fc.constantFrom(...SORT_BY, ...SORT_DIRECTIONS, 'ASC', 'email'),
  sourceList
);

const paramKey = fc.oneof(
  { weight: 4, arbitrary: fc.constantFrom(...KEYS) },
  { weight: 1, arbitrary: anyString }
);

const paramPairs = fc.array(fc.tuple(paramKey, paramValue), { maxLength: 12 });

const encode = (pairs: [string, string][]): string => {
  const params = new URLSearchParams();
  pairs.forEach(([key, value]) => params.append(key, value));
  return params.toString();
};

const queryString = fc.oneof(
  paramPairs.map(encode),
  paramPairs.map((pairs) =>
    pairs.map(([key, value]) => `${key}=${value}`).join('&')
  ),
  anyString
);

const toNextSearchParams = (qs: string): UsersSearchParams => {
  const params = new URLSearchParams(qs);
  return Object.fromEntries(
    [...new Set(params.keys())].map((key) => {
      const values = params.getAll(key);
      return [key, values.length === 1 ? values[0] : values];
    })
  );
};

const isRecognisedKey = (key: string) =>
  (KEYS as readonly string[]).includes(key);

const validParams = fc.record({
  page: fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
  pageSize: fc.integer({ min: 1, max: 100 }),
  search: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  sources: fc.option(
    fc.uniqueArray(fc.constantFrom(...Object.values(UserSource)), {
      minLength: 1
    }),
    { nil: undefined }
  ),
  minQualityScore: fc.option(fc.integer({ min: 0, max: 100 }), {
    nil: undefined
  }),
  maxQualityScore: fc.option(fc.integer({ min: 0, max: 100 }), {
    nil: undefined
  }),
  sortBy: fc.constantFrom(...SORT_BY),
  sortDirection: fc.constantFrom(...SORT_DIRECTIONS)
});

const serialise = (params: ParsedUsersParams): string => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    query.set(key, Array.isArray(value) ? value.join(',') : String(value));
  });
  return query.toString();
};

describe('parseUsersSearchParams properties', () => {
  it('[USERS-001] never throws for any query string', () => {
    assertProperty(
      fc.property(queryString, (qs) => {
        expect(() =>
          parseUsersSearchParams(toNextSearchParams(qs))
        ).not.toThrow();
      })
    );
  });

  it('[USERS-002] always returns a query that getTeamParticipants accepts', () => {
    assertProperty(
      fc.property(queryString, (qs) => {
        const parsed = parseUsersSearchParams(toNextSearchParams(qs));

        expect(
          teamParticipantsQuerySchema.safeParse({ slug: 'team', ...parsed })
            .success
        ).toBe(true);
        expect(Number.isSafeInteger(parsed.page)).toBe(true);
        expect(Number.isInteger(parsed.pageSize)).toBe(true);
        [parsed.minQualityScore, parsed.maxQualityScore].forEach((score) => {
          expect(score === undefined || Number.isInteger(score)).toBe(true);
        });
        expect(parsed.sources?.length).not.toBe(0);
        expect(new Set(parsed.sources).size).toBe(parsed.sources?.length ?? 0);
      })
    );
  });

  it('[USERS-003] returns the defaults when no key is recognised', () => {
    const unknownPairs = fc.array(
      fc.tuple(
        anyString.filter((key) => !isRecognisedKey(key)),
        paramValue
      ),
      { maxLength: 8 }
    );

    assertProperty(
      fc.property(unknownPairs, (pairs) => {
        expect(
          parseUsersSearchParams(toNextSearchParams(encode(pairs)))
        ).toEqual(DEFAULTS);
      })
    );
  });

  it('[USERS-004] round-trips a valid query through its query string', () => {
    assertProperty(
      fc.property(validParams, (params) => {
        expect(
          parseUsersSearchParams(toNextSearchParams(serialise(params)))
        ).toEqual(params);
      })
    );
  });

  it('[USERS-005] reads only the first value of a repeated key', () => {
    assertProperty(
      fc.property(paramPairs, (pairs) => {
        const decoded = [...new URLSearchParams(encode(pairs))];
        const firstOccurrences = decoded.filter(
          ([key], index) => decoded.findIndex(([k]) => k === key) === index
        );

        expect(
          parseUsersSearchParams(toNextSearchParams(encode(pairs)))
        ).toEqual(
          parseUsersSearchParams(toNextSearchParams(encode(firstOccurrences)))
        );
      })
    );
  });
});
