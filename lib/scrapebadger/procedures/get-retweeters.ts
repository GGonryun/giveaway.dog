import { getScrapeBadgerClient } from '../client';
import { User } from 'scrapebadger';

const DEFAULT_MAX_USERS = 5000;

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

export const fetchAllRetweetersForTweet = async ({
  tweetId,
  maxUsers = DEFAULT_MAX_USERS
}: {
  tweetId: string;
  maxUsers?: number;
}): Promise<{ users: User[]; nextCursor?: string; hasMore: boolean }> => {
  const client = getScrapeBadgerClient();
  const users: User[] = [];
  let cursor: string | undefined;
  let hasMore = true;

  console.info(
    `Fetching retweeters for tweet ${tweetId} with maxUsers=${maxUsers}`
  );

  while (hasMore && users.length < maxUsers) {
    console.info(`Fetching retweeters batch, current count=${users.length}`);
    const response = await client.twitter.tweets.getRetweeters(tweetId, {
      cursor,
      count: 100
    });

    users.push(...(response.data || []));

    hasMore = response.hasMore || false;
    cursor = response.nextCursor;

    console.info(
      `Fetched ${users.length} retweeters so far, hasMore=${hasMore}`
    );
    if (!hasMore || !cursor) {
      console.info('No more retweeters to fetch, exiting loop');
      break;
    }

    if (users.length >= maxUsers) {
      users.splice(maxUsers);
      break;
    }
  }

  console.info(`Finished fetching retweeters, total count=${users.length}`);
  return {
    users,
    nextCursor: cursor,
    hasMore
  };
};
