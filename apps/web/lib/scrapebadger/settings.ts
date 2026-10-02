export const CREDIT_COSTS = {
  LOAD_TWEET_ENDPOINT: 1, // Cost for /api/pickers/x/public/load-tweet
  PICK_WINNERS_ENDPOINT: 1 // Cost for /api/pickers/x/public/pick-winners
} as const;

// ScrapeBadger credit limit (per day)
export const SCRAPEBADGER_CREDIT_LIMIT = 20;
