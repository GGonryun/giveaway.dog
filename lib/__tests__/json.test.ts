import { describe, it, expect } from 'vitest';
import { toJsonObject } from '../json';

describe('toJsonObject', () => {
  describe('when the value is falsy', () => {
    it.each([
      ['null', null],
      ['an empty string', ''],
      ['zero', 0],
      ['false', false]
    ])('returns an empty object for %s', (_label, value) => {
      expect(toJsonObject(value)).toEqual({});
    });
  });

  describe('when the value is a plain object', () => {
    it('returns the same object reference', () => {
      const value = { a: 1, nested: { b: [1, 2] } };

      expect(toJsonObject(value)).toBe(value);
    });

    it('returns an empty object input as is', () => {
      const value = {};

      expect(toJsonObject(value)).toBe(value);
    });
  });

  describe('when the value is not an object', () => {
    it.each([
      ['a non empty string', 'hello'],
      ['a number', 42],
      ['true', true],
      ['an array', [1, 2, 3]],
      ['an empty array', []],
      ['an array of objects', [{ a: 1 }]]
    ])('returns an empty object for %s', (_label, value) => {
      expect(toJsonObject(value)).toEqual({});
    });
  });
});
