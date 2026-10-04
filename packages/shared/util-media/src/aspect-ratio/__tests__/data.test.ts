import { describe, it, expect } from 'vitest';
import { aspectRatioSchema, parseAspectRatio } from '../data';

describe('aspectRatioSchema', () => {
  it.each(['VIDEO', 'NONE'])('accepts %s', (value) => {
    expect(aspectRatioSchema.parse(value)).toBe(value);
  });

  it.each(['video', 'SQUARE', '', 1, null, undefined])(
    'rejects %s',
    (value) => {
      expect(aspectRatioSchema.safeParse(value).success).toBe(false);
    }
  );
});

describe('parseAspectRatio', () => {
  it('returns VIDEO when given VIDEO', () => {
    expect(parseAspectRatio('VIDEO')).toBe('VIDEO');
  });

  it('returns NONE when given NONE', () => {
    expect(parseAspectRatio('NONE')).toBe('NONE');
  });

  it.each([
    ['a lowercase value', 'none'],
    ['an unknown string', 'SQUARE'],
    ['an empty string', ''],
    ['a number', 16 / 9],
    ['null', null],
    ['undefined', undefined],
    ['an object', { value: 'NONE' }]
  ])('falls back to VIDEO for %s', (_label, value) => {
    expect(parseAspectRatio(value)).toBe('VIDEO');
  });
});
