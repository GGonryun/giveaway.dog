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
