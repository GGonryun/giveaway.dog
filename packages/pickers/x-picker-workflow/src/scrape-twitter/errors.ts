import 'server-only';

import { isTransientError, retryAfterOf } from '@giveaway/util-errors';
import { FatalError, RetryableError } from 'workflow';

export const STEP_RETRY_DELAY_MS = 60_000;

export const toStepError = (error: unknown, message: string) =>
  isTransientError(error)
    ? new RetryableError(`${message}: ${error}`, {
        retryAfter: new Date(
          Math.max(retryAfterOf(error) ?? 0, Date.now() + STEP_RETRY_DELAY_MS)
        )
      })
    : new FatalError(`${message}: ${error}`);
