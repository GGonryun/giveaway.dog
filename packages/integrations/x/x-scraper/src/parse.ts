import 'server-only';

import type { z } from 'zod';
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
