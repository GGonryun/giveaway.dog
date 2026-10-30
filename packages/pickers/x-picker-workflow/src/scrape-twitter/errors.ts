import 'server-only';

import { isTransientError } from '@giveaway/util-errors';
import { FatalError, RetryableError } from 'workflow';

export const STEP_RETRY_DELAY_MS = 60_000;

const RETRYABLE_SCRAPEBADGER_ERRORS = ['RateLimitError', 'ServerError'];

const resetTimeOf = (error: unknown) => {
  const { name, retryAfter } = error as {
    name?: unknown;
    retryAfter?: unknown;
  };
  return name === 'RateLimitError' && typeof retryAfter === 'number'
    ? retryAfter * 1000
    : undefined;
};

const isRetryable = (error: unknown) =>
  (error instanceof Error &&
    RETRYABLE_SCRAPEBADGER_ERRORS.includes(error.name)) ||
  isTransientError(error);

export const toStepError = (error: unknown, message: string) =>
  isRetryable(error)
    ? new RetryableError(`${message}: ${error}`, {
        retryAfter: new Date(
          Math.max(resetTimeOf(error) ?? 0, Date.now() + STEP_RETRY_DELAY_MS)
        )
      })
    : new FatalError(`${message}: ${error}`);
