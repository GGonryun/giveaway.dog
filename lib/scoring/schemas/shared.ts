// ============================================================================
// Shared Scoring Constants
// ============================================================================

// Base score assigned to all platform imports
export const PLATFORM_BASE_SCORE = 30;

// Giveaway participation threshold
export const GIVEAWAYS_ENTERED_THRESHOLD = 5; // +1 per 5 giveaways

// Description scoring
export const TWITTER_DESCRIPTION_CHARS_PER_POINT = 10; // +1 per 10 chars
export const BLUESKY_DESCRIPTION_CHARS_PER_POINT = 10; // +1 per 10 chars

// Twitter social metrics
export const TWITTER_FOLLOWERS_PER_POINT = 100; // +1 per 100 followers
export const TWITTER_FOLLOWING_PER_POINT = 250; // +1 per 250 following
export const TWITTER_TWEETS_PER_POINT = 2000; // +1 per 2000 tweets

// Bluesky social metrics
export const BLUESKY_FOLLOWERS_PER_POINT = 50; // +1 per 50 followers (smaller platform)
export const BLUESKY_FOLLOWING_PER_POINT = 62; // +1 per 62 following (proportional to Twitter's 250)
export const BLUESKY_POSTS_PER_POINT = 50; // +1 per 50 posts

// Account age scoring
export const TWITTER_ACCOUNT_AGE_MONTHS_PER_POINT = 3; // +1 per 3 months
export const BLUESKY_ACCOUNT_AGE_MONTHS_PER_POINT = 3; // +1 per 3 months
