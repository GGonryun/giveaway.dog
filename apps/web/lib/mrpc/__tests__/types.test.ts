import { describe, it, expect } from 'vitest';
import { isFailureData } from '../types';

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
