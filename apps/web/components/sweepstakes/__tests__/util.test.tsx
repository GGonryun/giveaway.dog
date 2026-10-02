import { describe, expect, it } from 'vitest';
import { toBrowsePageUrl } from '../util';

describe('toBrowsePageUrl', () => {
  it('builds the public giveaway.dog url for a sweepstakes', () => {
    expect(toBrowsePageUrl('summer-giveaway')).toBe(
      'https://giveaway.dog/browse/summer-giveaway'
    );
  });

  it('does not encode the id', () => {
    expect(toBrowsePageUrl('a b')).toBe('https://giveaway.dog/browse/a b');
  });
});
