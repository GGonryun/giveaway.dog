import { Prisma } from '@prisma/client';
import { nanoid } from 'nanoid';
import { Failure, Result } from './types';

export const isNextRedirect = (err: any): err is Error => {
  const isDigest =
    'digest' in err &&
    typeof err.digest === 'string' &&
    err.digest.startsWith('NEXT_REDIRECT');
  const isMessage =
    'message' in err &&
    typeof err.message === 'string' &&
    err.message.startsWith('NEXT_REDIRECT');
  return isDigest && isMessage;
};

export const isPrismaKnownError = (
  err: any
): err is Prisma.PrismaClientKnownRequestError => {
  return err instanceof Prisma.PrismaClientKnownRequestError;
};

export const prismaErrorBoundary = (
  err: Prisma.PrismaClientKnownRequestError
): Failure => {
  console.error(err);
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
