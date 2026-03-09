import { scrapeBadgerCredits } from '@/lib/ratelimit';
import { ApplicationError } from '@/lib/errors';

/**
 * Check if user has enough credits and consume them if they do
 * Throws ApplicationError if insufficient credits
 *
 * Anonymous users share a global pool of 10k credits per day (using key 'anonymous')
 * Authenticated users get 10k credits per day individually (using their userId)
 */
export async function checkAndConsumeCredits(
  userId: string | null,
  cost: number
): Promise<void> {
  // Anonymous users all use the same 'anonymous' identifier (shared pool)
  // Authenticated users use their userId (individual pool)
  const identifier = userId || 'anonymous';

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
