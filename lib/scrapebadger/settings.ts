export const CREDIT_COSTS = {
  LOAD_TWEET_ENDPOINT: 20, // Cost for /api/pickers/x/public/load-tweet
  PICK_WINNERS_ENDPOINT: 20, // Cost for /api/pickers/x/public/pick-winners
  GET_TWEET: 25,
  GET_USER: 25,
  GET_RETWEETERS_PER_CALL: 50
} as const;

// ScrapeBadger credit limit (per day)
export const SCRAPEBADGER_CREDIT_LIMIT = 10_000;
