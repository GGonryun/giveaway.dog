import 'server-only';

import { scrapeBadgerCredits } from './ratelimit';
import { ApplicationError } from '@giveaway/util-errors';

export async function checkAndConsumeCredits(
  headers: Headers,
  cost: number
): Promise<void> {
  const ip =
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    headers.get('x-real-ip') ??
    'unknown';
  const identifier = `ip:${ip}`;

  // Use rate limit to consume the specified cost
  const result = await scrapeBadgerCredits.limit(identifier, {
    rate: cost
  });

  if (!result.success) {
    const retryAfterSeconds = Math.ceil((result.reset - Date.now()) / 1000);

    throw new ApplicationError({
      code: 'TOO_MANY_REQUESTS',
      message: `Insufficient credits. Need ${cost}, have ${result.remaining}. Resets in ${retryAfterSeconds} seconds.`,
      data: {
        creditsNeeded: cost,
        creditsRemaining: result.remaining,
        retryAfter: result.reset,
        retryAfterISO: new Date(result.reset).toISOString()
      }
    });
  }
}
