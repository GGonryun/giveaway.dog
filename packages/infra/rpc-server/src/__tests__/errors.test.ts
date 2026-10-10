import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Prisma } from '@giveaway/db-model';
import { ApplicationError } from '@giveaway/util-errors';
import {
  isPrismaError,
  prismaErrorBoundary,
  settle,
  toFailure
} from '../errors';
import { knownRequestError } from '@giveaway/testing-server/prisma';

const nanoidMock = vi.hoisted(() => vi.fn());

vi.mock('nanoid', () => ({ nanoid: nanoidMock }));

const validationError = (message = 'Invalid field') =>
  new Prisma.PrismaClientValidationError(message, { clientVersion: 'test' });

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

describe('toFailure', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps the code, message, cause and data of an ApplicationError', () => {
    const error = new ApplicationError({
      code: 'CONFLICT',
      message: 'taken',
      data: { field: 'slug' }
    });

    expect(toFailure(error)).toEqual({
      ok: false,
      data: {
        code: 'CONFLICT',
        message: 'taken',
        cause: error.cause,
        data: { field: 'slug' }
      }
    });
  });

  it('turns any other error into INTERNAL_SERVER_ERROR with its message', () => {
    expect(toFailure(new Error('db down'))).toEqual({
      ok: false,
      data: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'db down',
        cause: undefined,
        data: undefined
      }
    });
  });

  it('uses a default message for a value that is not an error', () => {
    expect(toFailure(undefined).data).toEqual(
      expect.objectContaining({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      })
    );
  });

  it('applies the Prisma boundary to a Prisma error', () => {
    expect(toFailure(validationError()).data.code).toBe('BAD_REQUEST');
  });
});

describe('settle', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('wraps the value of a fulfilled promise in a success', async () => {
    await expect(settle(Promise.resolve({ processed: 2 }))).resolves.toEqual({
      ok: true,
      data: { processed: 2 }
    });
  });

  it('turns a rejection into a failure instead of throwing', async () => {
    await expect(settle(Promise.reject(new Error('down')))).resolves.toEqual(
      expect.objectContaining({
        ok: false,
        data: expect.objectContaining({ message: 'down' })
      })
    );
  });
});
