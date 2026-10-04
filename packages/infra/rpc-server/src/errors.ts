import 'server-only';

import { Prisma } from '@giveaway/db-model';
import { nanoid } from 'nanoid';
import { Failure } from '@giveaway/rpc-model/types';
import { assertNever } from '@giveaway/util-errors';

export const isPrismaError = (
  err: any
): err is
  | Prisma.PrismaClientKnownRequestError
  | Prisma.PrismaClientValidationError => {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientValidationError
  );
};

export const prismaErrorBoundary = (
  err: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError
): Failure => {
  console.error(`Encountered prisma error`, err);

  if (isPrismaValidationError(err)) {
    return prismaValidationErrorBoundary(err);
  }

  if (isPrismaKnownClientError(err)) {
    return prismaKnownClientErrorBoundary(err);
  }

  throw assertNever(err);
};

const isPrismaKnownClientError = (
  err: any
): err is Prisma.PrismaClientKnownRequestError => {
  return err instanceof Prisma.PrismaClientKnownRequestError;
};

const prismaKnownClientErrorBoundary = (
  err: Prisma.PrismaClientKnownRequestError
): Failure => {
  switch (err.code) {
    case 'P2025':
      return {
        ok: false,
        data: {
          code: 'NOT_FOUND',
          message:
            'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
        }
      };
    default:
      return {
        ok: false,
        data: {
          code: 'INTERNAL_SERVER_ERROR',
          message: `We f****d up. Try again or contact giveaway.dog support staff and provide the following error code: ${nanoid(6)}`
        }
      };
  }
};

const isPrismaValidationError = (
  err: any
): err is Prisma.PrismaClientValidationError => {
  return err instanceof Prisma.PrismaClientValidationError;
};

const prismaValidationErrorBoundary = (
  err?: Prisma.PrismaClientValidationError
): Failure => {
  if (err) {
    console.error('[Prisma Validation Error]', {
      message: err.message,
      stack: err.stack
    });
  }
  return {
    ok: false,
    data: {
      code: 'BAD_REQUEST',
      message: `Invalid data provided. Please check your input and try again. If the problem persists, contact support.`
    }
  };
};
