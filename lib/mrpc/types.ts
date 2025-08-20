import { ApplicationErrorCode } from '../errors';

export type Success<T> = { ok: true; data: T };
export type Failure = {
  ok: false;
  data: {
    code: ApplicationErrorCode;
    message: string;
  };
};
export type Result<TSuccess = {}> = Success<TSuccess> | Failure;
