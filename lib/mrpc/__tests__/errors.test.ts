import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { isNextRedirect, isPrismaError, prismaErrorBoundary } from '../errors';
import { knownRequestError } from '@/test/prisma';

const nanoidMock = vi.hoisted(() => vi.fn());

vi.mock('nanoid', () => ({ nanoid: nanoidMock }));

const validationError = (message = 'Invalid field') =>
  new Prisma.PrismaClientValidationError(message, { clientVersion: 'test' });

const redirectError = (digest: unknown, message: unknown) =>
  Object.assign(Object.create(Error.prototype), { digest, message });

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

describe('isPrismaError', () => {
  it('returns true for a PrismaClientKnownRequestError', () => {
    expect(isPrismaError(knownRequestError('P2002'))).toBe(true);
  });

  it('returns true for a PrismaClientValidationError', () => {
    expect(isPrismaError(validationError())).toBe(true);
  });

  it('returns false for a generic Error', () => {
    expect(isPrismaError(new Error('boom'))).toBe(false);
  });

  it('returns false for an object that only looks like a prisma error', () => {
    expect(isPrismaError({ code: 'P2025', clientVersion: 'test' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isPrismaError(null)).toBe(false);
  });
});

describe('prismaErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    nanoidMock.mockReset();
    nanoidMock.mockReturnValue('abc123');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when the error is a known request error with code P2025', () => {
    it('returns a NOT_FOUND failure with a retry message', () => {
      const result = prismaErrorBoundary(knownRequestError('P2025'));

      expect(result).toEqual({
        ok: false,
        data: {
          code: 'NOT_FOUND',
          message:
            'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
        }
      });
    });

    it('does not generate an error reference code', () => {
      prismaErrorBoundary(knownRequestError('P2025'));

      expect(nanoidMock).not.toHaveBeenCalled();
    });
  });

  describe('when the error is a known request error with another code', () => {
    it('returns an INTERNAL_SERVER_ERROR failure with a reference code', () => {
      const result = prismaErrorBoundary(knownRequestError('P2002'));

      expect(result).toEqual({
        ok: false,
        data: {
          code: 'INTERNAL_SERVER_ERROR',
          message:
            'We f****d up. Try again or contact giveaway.dog support staff and provide the following error code: abc123'
        }
      });
    });

    it('generates a six character reference code', () => {
      prismaErrorBoundary(knownRequestError('P2003'));

      expect(nanoidMock).toHaveBeenCalledWith(6);
    });
  });

  describe('when the error is a validation error', () => {
    it('returns a BAD_REQUEST failure', () => {
      const result = prismaErrorBoundary(validationError());

      expect(result).toEqual({
        ok: false,
        data: {
          code: 'BAD_REQUEST',
          message:
            'Invalid data provided. Please check your input and try again. If the problem persists, contact support.'
        }
      });
    });

    it('logs the validation message and stack', () => {
      const err = validationError('Argument `id` is missing');

      prismaErrorBoundary(err);

      expect(console.error).toHaveBeenCalledWith('[Prisma Validation Error]', {
        message: 'Argument `id` is missing',
        stack: err.stack
      });
    });
  });

  it('logs every prisma error it handles', () => {
    const err = knownRequestError('P2025');

    prismaErrorBoundary(err);

    expect(console.error).toHaveBeenCalledWith('Encountered prisma error', err);
  });

  it('throws an unexpected value error when given a non-prisma error', () => {
    const err = new Error('not prisma');

    expect(() =>
      prismaErrorBoundary(
        err as unknown as Prisma.PrismaClientKnownRequestError
      )
    ).toThrow('Unexpected value: Error: not prisma');
  });
});
