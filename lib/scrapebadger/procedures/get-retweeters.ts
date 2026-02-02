import { getScrapeBadgerClient } from '../client';

// const DEFAULT_MAX_USERS = 5000;

// async function fetchAllRetweeters(
//   tweetId: string,
//   maxUsers: number,
//   initialCursor?: string
// ): Promise<ScrapeBadgerResponseSchema> {
//   const client = getScrapeBadgerClient();
//   const users: ScrapeBadgerUser[] = [];
//   let cursor = initialCursor;
//   let hasMore = true;

//   console.info(
//     `Fetching retweeters for tweet ${tweetId} with maxUsers=${maxUsers}`
//   );

//   while (hasMore && users.length < maxUsers) {
//     console.info(`Fetching retweeters batch, current count=${users.length}`);
//     const response = await client.twitter.tweets.getRetweeters(tweetId, {
//       cursor,
//       count: 100
//     });

//     users.push(...(response.data || []));

//     hasMore = response.hasMore || false;
//     cursor = response.nextCursor;

//     console.info(
//       `Fetched ${users.length} retweeters so far, hasMore=${hasMore}`
//     );
//     if (!hasMore || !cursor) {
//       console.info('No more retweeters to fetch, exiting loop');
//       break;
//     }

//     if (users.length >= maxUsers) {
//       users.splice(maxUsers);
//       break;
//     }
//   }

//   console.info(`Finished fetching retweeters, total count=${users.length}`);
//   return {
//     users,
//     nextCursor: cursor,
//     hasMore
//   };
// }

// export const getScrapeBadgerRetweeters = async (args: {
//   max?: number;
//   tweetId: string;
// }): Promise<ScrapeBadgerResponseSchema> => {
//   try {
//     return await fetchAllRetweeters(
//       args.tweetId,
//       args?.max ?? DEFAULT_MAX_USERS
//     );
//   } catch (error) {
//     throw new ApplicationError({
//       code: 'INTERNAL_SERVER_ERROR',
//       message: 'Failed to fetch retweeters, please try again later.',
//       cause: error
//     });
//   }
// };

export const getRetweeters = async ({
  tweetId,
  cursor
}: {
  tweetId: string;
  cursor?: string;
}) => {
  return await getScrapeBadgerClient().twitter.tweets.getRetweeters(tweetId, {
    cursor
  });
};
