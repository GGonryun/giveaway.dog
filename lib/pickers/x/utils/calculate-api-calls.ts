import {
  COVERAGE_TARGET,
  MINIMUM_REPOST_CALLS,
  MAXIMUM_REPOST_CALLS,
  USERS_PER_REQUEST
} from '../constants';

/**
 * Calculate the number of API calls needed to fetch retweeters
 * based on the total retweet count.
 *
 * Strategy:
 * - Target 30% coverage of all retweeters
 * - Each API call returns ~20 users
 * - Minimum 3 API calls to ensure decent sample size
 * - Maximum of 10 API calls to avoid excessive scraping
 *
 * @param retweetCount - Total number of retweets on the tweet
 * @returns Number of API calls to make
 */
export function calculateApiCalls(retweetCount: number): number {
  const targetUsers = retweetCount * COVERAGE_TARGET;
  const minCallsForCoverage = Math.ceil(targetUsers / USERS_PER_REQUEST);
  const count = Math.min(MAXIMUM_REPOST_CALLS, Math.max(MINIMUM_REPOST_CALLS, minCallsForCoverage));
  console.info(
    `Calculated API calls: retweetCount=${retweetCount}, targetUsers=${Math.floor(
      targetUsers
    )}, minCallsForCoverage=${minCallsForCoverage}, finalCount=${count}`
  );
  return count;
}

/**
 * Estimate the duration in milliseconds for fetching retweeters
 * based on the number of API calls.
 *
 * @param apiCalls - Number of API calls that will be made
 * @returns Estimated duration in milliseconds
 */
export function estimateDuration(apiCalls: number): number {
  // Each API call takes approximately 1 second
  return apiCalls * 1000;
}
