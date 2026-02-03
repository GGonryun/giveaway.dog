// types/scrapebadger.d.ts
declare module 'scrapebadger' {
  export type User = import('scrapebadger/dist/index.d.ts').User;
  export type Tweet = import('scrapebadger/dist/index.d.ts').Tweet;
  export const ScrapeBadger: typeof import('scrapebadger/dist/index.d.ts').ScrapeBadger;
  // repeat for any other types you need
}

// // types/scrapebadger.d.ts
// declare module 'scrapebadger' {
//   export * from 'scrapebadger/dist/index';
//   export { default } from 'scrapebadger/dist/index';
// }
