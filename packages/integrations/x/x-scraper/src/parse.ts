import 'server-only';

import type { z } from 'zod';
import { RateLimitError, ServerError } from 'scrapebadger';
import { ApplicationError } from '@giveaway/util-errors';

export const parseScrapeBadgerResponse = <T>(
  schema: z.ZodType,
  response: T,
  call: string
): T => {
  const result = schema.safeParse(response);

  if (!result.success) {
    console.error(
      `[ScrapeBadger] The ${call} response does not match its schema:`,
      result.error.issues
    );
    throw new ApplicationError({
      code: 'BAD_GATEWAY',
      message: `Could not read the ${call} from X`,
      cause: result.error
    });
  }

  return response;
};

const isRateLimitError = (
  error: unknown
): error is { retryAfter: number | undefined } =>
  error instanceof RateLimitError;

const isServerError = (error: unknown): error is { statusCode: number } =>
  error instanceof ServerError;

export const toScrapeBadgerError = (error: unknown, call: string) => {
  if (isRateLimitError(error)) {
    return new ApplicationError({
      code: 'TOO_MANY_REQUESTS',
      message: `ScrapeBadger rate limited the ${call} request`,
      cause: error,
      data: {
        status: 429,
        ...(error.retryAfter !== undefined && {
          retryAfter: error.retryAfter * 1000
        })
      }
    });
  }
  if (isServerError(error)) {
    return new ApplicationError({
      code: 'BAD_GATEWAY',
      message: `ScrapeBadger failed the ${call} request: ${error.statusCode}`,
      cause: error,
      data: { status: error.statusCode }
    });
  }
  return error;
};
