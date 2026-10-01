import { describe, it, expect } from 'vitest';
import { strings } from '../strings';

describe('strings.replace', () => {
  it('replaces every occurrence of the value', () => {
    expect(strings.replace('a-b-c', '-', '+')).toBe('a+b+c');
  });

  it('returns the target unchanged when the value is absent', () => {
    expect(strings.replace('hello', 'x', 'y')).toBe('hello');
  });

  it('treats regex special characters in the value literally', () => {
    expect(strings.replace('a.b.c', '.', '!')).toBe('a!b!c');
  });

  it.each([
    ['*', 'a*b', 'a_b'],
    ['+', 'a+b', 'a_b'],
    ['?', 'a?b', 'a_b'],
    ['^', 'a^b', 'a_b'],
    ['$', 'a$b', 'a_b'],
    ['{}', 'a{}b', 'a_b'],
    ['()', 'a()b', 'a_b'],
    ['|', 'a|b', 'a_b'],
    ['[]', 'a[]b', 'a_b'],
    ['\\', 'a\\b', 'a_b']
  ])('escapes the %s characters', (value, target, expected) => {
    expect(strings.replace(target, value, '_')).toBe(expected);
  });

  it('converts numeric values and replacements to strings', () => {
    expect(strings.replace('Win 1 of 1 prizes', 1, 3)).toBe(
      'Win 3 of 3 prizes'
    );
  });

  it('replaces template placeholders', () => {
    expect(strings.replace('Hi {name}, {name}!', '{name}', 'Ana')).toBe(
      'Hi Ana, Ana!'
    );
  });

  it('is case sensitive', () => {
    expect(strings.replace('Dog dog', 'dog', 'cat')).toBe('Dog cat');
  });

  it('interprets dollar patterns in the replacement', () => {
    expect(strings.replace('a.b', '.', '$&$&')).toBe('a..b');
  });

  it('inserts the replacement between every character for an empty value', () => {
    expect(strings.replace('ab', '', '-')).toBe('-a-b-');
  });

  it('returns an empty string for an empty target', () => {
    expect(strings.replace('', 'a', 'b')).toBe('');
  });
});

describe('strings.obfuscate', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['an empty string', '']
  ])('returns null for %s', (_label, value) => {
    expect(strings.obfuscate(value)).toBeNull();
  });

  it('returns null when there is no domain', () => {
    expect(strings.obfuscate('not-an-email')).toBeNull();
  });

  it('returns null when the domain is empty', () => {
    expect(strings.obfuscate('user@')).toBeNull();
  });

  it('keeps the first and last character of the local part', () => {
    expect(strings.obfuscate('jonathan@example.com')).toBe('j***n@example.com');
  });

  it('repeats a single character local part', () => {
    expect(strings.obfuscate('a@example.com')).toBe('a***a@example.com');
  });

  it('renders undefined for an empty local part', () => {
    expect(strings.obfuscate('@example.com')).toBe('undefined***@example.com');
  });

  it('keeps only the segment after the first @ as the domain', () => {
    expect(strings.obfuscate('ab@cd@example.com')).toBe('a***b@cd');
  });
});
