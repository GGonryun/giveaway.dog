import type { ApplicationErrorCode } from '@/lib/errors';
import type { FailureData, Result } from '@/lib/mrpc/types';

export const expectOk = <T>(result: Result<T>): T => {
  if (!result.ok) {
    throw new Error(
      `Expected an ok result, got ${result.data.code}: ${result.data.message}`
    );
  }
  return result.data;
};

export const expectFailure = <T>(
  result: Result<T>,
  code?: ApplicationErrorCode
): FailureData => {
  if (result.ok) {
    throw new Error(
      `Expected a failure result, got ok: ${JSON.stringify(result.data)}`
    );
  }
  if (code && result.data.code !== code) {
    throw new Error(
      `Expected failure code ${code}, got ${result.data.code}: ${result.data.message}`
    );
  }
  return result.data;
};
