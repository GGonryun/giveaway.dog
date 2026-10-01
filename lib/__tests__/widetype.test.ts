import { describe, it, expect } from 'vitest';
import { widetype, isDefined } from '../widetype';

describe('widetype', () => {
  describe('fromEntries', () => {
    it('builds an object from key value pairs', () => {
      expect(
        widetype.fromEntries([
          ['a', 1],
          ['b', 2]
        ])
      ).toEqual({ a: 1, b: 2 });
    });

    it('keeps the last value for duplicate keys', () => {
      expect(
        widetype.fromEntries([
          ['a', 1],
          ['a', 3]
        ])
      ).toEqual({ a: 3 });
    });

    it('returns an empty object for no entries', () => {
      expect(widetype.fromEntries([])).toEqual({});
    });
  });

  describe('entries', () => {
    it('returns own enumerable key value pairs in insertion order', () => {
      expect(widetype.entries({ b: 'x', a: 'y' })).toEqual([
        ['b', 'x'],
        ['a', 'y']
      ]);
    });

    it('returns string keys for arrays', () => {
      expect(widetype.entries(['p', 'q'])).toEqual([
        ['0', 'p'],
        ['1', 'q']
      ]);
    });

    it('returns an empty array for an empty object', () => {
      expect(widetype.entries({})).toEqual([]);
    });
  });

  describe('values', () => {
    it('returns own enumerable values in insertion order', () => {
      expect(widetype.values({ b: 2, a: 1 })).toEqual([2, 1]);
    });

    it('returns an empty array for an empty object', () => {
      expect(widetype.values({})).toEqual([]);
    });
  });

  describe('keys', () => {
    it('returns own enumerable keys in insertion order', () => {
      expect(widetype.keys({ z: 1, y: 2 })).toEqual(['z', 'y']);
    });

    it('lists integer like keys first in ascending order', () => {
      expect(widetype.keys({ b: 1, 2: 'two', 1: 'one' })).toEqual([
        '1',
        '2',
        'b'
      ]);
    });

    it('ignores inherited properties', () => {
      const proto = { inherited: true };
      const obj = Object.create(proto) as { own?: number };
      obj.own = 1;

      expect(widetype.keys(obj)).toEqual(['own']);
    });
  });
});

describe('isDefined', () => {
  type Item = { name?: string | null; count?: number | null };
  const hasName = isDefined<Item, 'name'>('name');

  it('returns false for null', () => {
    expect(hasName(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(hasName(undefined)).toBe(false);
  });

  it('returns false when the property is null', () => {
    expect(hasName({ name: null })).toBe(false);
  });

  it('returns false when the property is undefined', () => {
    expect(hasName({ name: undefined })).toBe(false);
  });

  it('returns false when the property is missing', () => {
    expect(hasName({ count: 1 })).toBe(false);
  });

  it('returns true when the property has a value', () => {
    expect(hasName({ name: 'Rex' })).toBe(true);
  });

  it.each([
    ['an empty string', ''],
    ['zero', 0],
    ['false', false],
    ['NaN', Number.NaN]
  ])('returns true when the property is %s', (_label, value) => {
    const check = isDefined<{ value?: unknown }, 'value'>('value');

    expect(check({ value })).toBe(true);
  });

  it('filters an array down to items with the property set', () => {
    const items: (Item | null)[] = [
      { name: 'a' },
      null,
      { name: null },
      { count: 2 },
      { name: 'b', count: 3 }
    ];

    expect(items.filter(isDefined<Item, 'name'>('name'))).toEqual([
      { name: 'a' },
      { name: 'b', count: 3 }
    ]);
  });
});
