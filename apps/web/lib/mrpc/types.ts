import { ApplicationErrorCode } from '../errors';

export type Success<T> = { ok: true; data: T };

export type FailureData = {
  code: ApplicationErrorCode;
  message: string;
  cause?: unknown;
  data?: unknown;
};

export type Failure = {
  ok: false;
  data: FailureData;
};
export type Result<TSuccess = {}> = Success<TSuccess> | Failure;

export const isFailureData = (error: unknown): error is Failure['data'] => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
};

export const isNextRedirect = (err: unknown): err is Error => {
  const error = err as { digest?: unknown; message?: unknown };
  const isDigest =
    'digest' in error &&
    typeof error.digest === 'string' &&
    error.digest.startsWith('NEXT_REDIRECT');
  const isMessage =
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.startsWith('NEXT_REDIRECT');
  return isDigest && isMessage;
};
