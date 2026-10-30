// types/scrapebadger.d.ts
declare module 'scrapebadger' {
  export type User = import('scrapebadger/dist/index.d.ts').User;
  export type Tweet = import('scrapebadger/dist/index.d.ts').Tweet;
  export const ScrapeBadger: typeof import('scrapebadger/dist/index.d.ts').ScrapeBadger;
  export const NotFoundError: typeof import('scrapebadger/dist/index.d.ts').NotFoundError;
  export const RateLimitError: typeof import('scrapebadger/dist/index.d.ts').RateLimitError;
  export const ServerError: typeof import('scrapebadger/dist/index.d.ts').ServerError;
  // repeat for any other types you need
}
