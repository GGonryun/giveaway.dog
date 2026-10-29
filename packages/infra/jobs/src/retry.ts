import 'server-only';

import { isTransientError, retryAfterOf } from '@giveaway/util-errors';

export const MAX_JOB_ATTEMPTS = 5;
export const JOB_RETRY_BASE_MS = 5 * 60 * 1000;

export const toJobRetryAt = ({
  error,
  attempts,
  now = new Date()
}: {
  error: unknown;
  attempts: number;
  now?: Date;
}): Date | null => {
  if (attempts + 1 >= MAX_JOB_ATTEMPTS || !isTransientError(error)) {
    return null;
  }
  const backoff = JOB_RETRY_BASE_MS * 2 ** attempts;
  return new Date(Math.max(now.getTime() + backoff, retryAfterOf(error) ?? 0));
};
