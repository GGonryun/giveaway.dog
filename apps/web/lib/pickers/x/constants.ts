export const MINIMUM_REPOST_CALLS = 3; // Minimum API calls to fetch retweeters, even for low retweet counts, to ensure a decent sample size
export const MAXIMUM_REPOST_CALLS = 10; // Maximum API calls to fetch retweeters
export const COVERAGE_TARGET = 0.3; // aim to cover 30% of retweeters
export const USERS_PER_REQUEST = 20; // ScrapeBadger returns 20 users per call

export const X_PICKER_LIKES_KEY = 'x_picker_likes';
export const X_PICKER_RETWEETS_KEY = 'x_picker_retweets';
export const X_PICKER_REPLIES_KEY = 'x_picker_replies';
export const X_PICKER_QUOTES_KEY = 'x_picker_quotes';
