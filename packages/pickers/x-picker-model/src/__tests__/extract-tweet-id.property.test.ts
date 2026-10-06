import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { assertProperty } from '@giveaway/testing-server/property';
import { extractTweetId } from '../extract-tweet-id';
import { extractTweetIdFromUrl } from '../schemas/form';

const HOSTS = [
  'x.com',
  'twitter.com',
  'www.x.com',
  'www.twitter.com',
  'mobile.x.com',
  'mobile.twitter.com'
];

const MAX_SNOWFLAKE = (BigInt(1) << BigInt(63)) - BigInt(1);

const ASCII_DIGITS = /^[0-9]+$/;

const randomCase = (value: string) =>
  fc
    .array(fc.boolean(), { minLength: value.length, maxLength: value.length })
    .map((upper) =>
      value
        .split('')
        .map((char, i) => (upper[i] ? char.toUpperCase() : char))
        .join('')
    );

const scheme = fc.constantFrom('https://', 'http://', '');

const host = fc.constantFrom(...HOSTS).chain(randomCase);

const username = fc.stringMatching(/^[A-Za-z0-9_]{1,15}$/);

const tweetId = fc
  .bigInt({ min: BigInt(1), max: MAX_SNOWFLAKE })
  .map((id) => id.toString());

const statusPath = fc.oneof(
  username.map((name) => `/${name}/status/`),
  fc.constant('/i/web/status/'),
  fc.constant('/i/status/')
);

const safeSegment = fc.stringMatching(/^[A-Za-z0-9_-]{1,12}$/);

const trailingPath = fc.oneof(
  fc.constant(''),
  fc.constant('/'),
  fc.constantFrom('/photo/1', '/photo/2', '/video/1', '/analytics', '/quotes'),
  fc
    .array(fc.oneof(safeSegment, tweetId, fc.constant('status')), {
      minLength: 1,
      maxLength: 4
    })
    .chain((segments) =>
      fc.constantFrom('', '/').map((end) => `/${segments.join('/')}${end}`)
    )
);

const decoyQuery = fc
  .record({ s: fc.nat({ max: 99 }), t: safeSegment, decoy: tweetId })
  .map(({ s, t, decoy }) => `?s=${s}&t=${t}&ref=status/${decoy}`);

const query = fc.oneof(
  fc.constant(''),
  fc.webQueryParameters().map((params) => (params ? `?${params}` : '')),
  decoyQuery
);

const fragment = fc.oneof(
  fc.constant(''),
  fc.webFragments().map((value) => (value ? `#${value}` : '')),
  tweetId.map((decoy) => `#status/${decoy}`)
);

const validPostUrl = fc
  .record({
    scheme,
    host,
    statusPath,
    id: tweetId,
    trailingPath,
    query,
    fragment
  })
  .map((parts) => ({
    id: parts.id,
    url: `${parts.scheme}${parts.host}${parts.statusPath}${parts.id}${parts.trailingPath}${parts.query}${parts.fragment}`
  }));

const statusFragments = fc
  .array(
    fc.oneof(
      fc.constantFrom(
        'status/',
        'status',
        'statuses/',
        '/',
        'x.com/',
        'https://',
        '?',
        '#',
        '&',
        '٣',
        '１'
      ),
      fc.stringMatching(/^[0-9]{1,25}$/),
      fc.string({ unit: 'binary', maxLength: 5 })
    ),
    { maxLength: 12 }
  )
  .map((parts) => parts.join(''));

const arbitraryInput = fc.oneof(
  fc.string(),
  fc.string({ unit: 'binary' }),
  fc.string({ unit: 'grapheme' }),
  fc.webUrl({ withQueryParameters: true, withFragments: true }),
  statusFragments
);

const isNullOrAsciiDigits = (result: string | null) =>
  result === null || (typeof result === 'string' && ASCII_DIGITS.test(result));

describe('extractTweetId', () => {
  it('[TWEET-001] extracts the generated id from any valid post url', () => {
    assertProperty(
      fc.property(validPostUrl, ({ url, id }) => {
        expect(extractTweetId(url)).toBe(id);
      })
    );
  });

  it('[TWEET-002] returns null or ascii digits and never throws for any string', () => {
    assertProperty(
      fc.property(arbitraryInput, (input) => {
        expect(isNullOrAsciiDigits(extractTweetId(input))).toBe(true);
      })
    );
  });

  it('[TWEET-004] never throws for a non-string input', () => {
    assertProperty(
      fc.property(fc.anything(), (input) => {
        expect(() => extractTweetId(input as string)).not.toThrow();
      })
    );
  });
});

describe('extractTweetIdFromUrl', () => {
  it('[TWEET-001] extracts the generated id from any valid post url', () => {
    assertProperty(
      fc.property(validPostUrl, ({ url, id }) => {
        expect(extractTweetIdFromUrl(url)).toBe(id);
      })
    );
  });

  it('[TWEET-003] returns null or ascii digits, never throws and agrees with extractTweetId for any string', () => {
    assertProperty(
      fc.property(arbitraryInput, (input) => {
        const result = extractTweetIdFromUrl(input);
        expect(isNullOrAsciiDigits(result)).toBe(true);
        expect(result).toBe(extractTweetId(input));
      })
    );
  });
});
