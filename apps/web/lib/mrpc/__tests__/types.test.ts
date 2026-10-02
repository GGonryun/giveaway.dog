import { describe, it, expect } from 'vitest';
import { isFailureData, isNextRedirect } from '../types';

const redirectError = (digest: unknown, message: unknown) =>
  Object.assign(Object.create(Error.prototype), { digest, message });

describe('isFailureData', () => {
  it('returns true for an object with code and message', () => {
    expect(isFailureData({ code: 'NOT_FOUND', message: 'Missing' })).toBe(true);
  });

  it('returns true when code and message keys exist even if undefined', () => {
    expect(isFailureData({ code: undefined, message: undefined })).toBe(true);
  });

  it('returns true for an object carrying extra fields', () => {
    expect(
      isFailureData({ code: 'X', message: 'y', cause: 'z', data: { a: 1 } })
    ).toBe(true);
  });

  it('returns false when message is missing', () => {
    expect(isFailureData({ code: 'NOT_FOUND' })).toBe(false);
  });

  it('returns false when code is missing', () => {
    expect(isFailureData({ message: 'Missing' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isFailureData(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isFailureData(undefined)).toBe(false);
  });

  it('returns false for a string', () => {
    expect(isFailureData('NOT_FOUND')).toBe(false);
  });

  it('returns false for a number', () => {
    expect(isFailureData(404)).toBe(false);
  });

  it('returns true for an Error carrying a code property', () => {
    const error = Object.assign(new Error('boom'), { code: 'X' });

    expect(isFailureData(error)).toBe(true);
  });

  it('returns false for a plain Error without a code property', () => {
    expect(isFailureData(new Error('boom'))).toBe(false);
  });
});

describe('isNextRedirect', () => {
  it('returns true when both digest and message start with NEXT_REDIRECT', () => {
    const err = redirectError('NEXT_REDIRECT;replace;/x;307;', 'NEXT_REDIRECT');

    expect(isNextRedirect(err)).toBe(true);
  });

  it('returns false when only the digest starts with NEXT_REDIRECT', () => {
    const err = redirectError('NEXT_REDIRECT;replace;/x;307;', 'Other');

    expect(isNextRedirect(err)).toBe(false);
  });

  it('returns false when only the message starts with NEXT_REDIRECT', () => {
    const err = redirectError('SOMETHING_ELSE', 'NEXT_REDIRECT');

    expect(isNextRedirect(err)).toBe(false);
  });

  it('returns false when NEXT_REDIRECT appears later in the digest', () => {
    const err = redirectError(
      'X_NEXT_REDIRECT;replace;/x;307;',
      'NEXT_REDIRECT'
    );

    expect(isNextRedirect(err)).toBe(false);
  });

  it('returns false when NEXT_REDIRECT appears later in the message', () => {
    const err = redirectError(
      'NEXT_REDIRECT;replace;/x;307;',
      'Error: NEXT_REDIRECT'
    );

    expect(isNextRedirect(err)).toBe(false);
  });

  it('returns false when the digest is not a string', () => {
    const err = redirectError(42, 'NEXT_REDIRECT');

    expect(isNextRedirect(err)).toBe(false);
  });

  it('returns false when the message is not a string', () => {
    const err = redirectError('NEXT_REDIRECT', 42);

    expect(isNextRedirect(err)).toBe(false);
  });

  it('returns false for an error without a digest', () => {
    expect(isNextRedirect(new Error('NEXT_REDIRECT'))).toBe(false);
  });

  it('returns false for a plain object without digest or message', () => {
    expect(isNextRedirect({})).toBe(false);
  });

  it('is case sensitive about the NEXT_REDIRECT prefix', () => {
    const err = redirectError('next_redirect', 'next_redirect');

    expect(isNextRedirect(err)).toBe(false);
  });

  it('throws a TypeError when given null', () => {
    expect(() => isNextRedirect(null)).toThrow(TypeError);
  });

  it('throws a TypeError when given a string', () => {
    expect(() => isNextRedirect('NEXT_REDIRECT')).toThrow(TypeError);
  });
});
