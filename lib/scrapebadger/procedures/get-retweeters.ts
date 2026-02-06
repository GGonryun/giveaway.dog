import { compact } from 'lodash';
import { getScrapeBadgerClient } from '../client';
import { User } from 'scrapebadger';

const DEFAULT_MAX_USERS = 5000;

export const getRetweeters = async ({
  tweetId,
  cursor
}: {
  tweetId: string;
  cursor?: string;
  maxUsers?: string;
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
      count: 20
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

export const fetchRetweetersUntilUser = async ({
  tweetId,
  stopAtUserId,
  maxUsers = DEFAULT_MAX_USERS
}: {
  tweetId: string;
  stopAtUserId?: string;
  maxUsers?: number;
}): Promise<{ users: User[]; nextCursor?: string; hasMore: boolean }> => {
  const client = getScrapeBadgerClient();
  const users: User[] = [];
  let cursor: string | undefined;
  let hasMore = true;
  let foundStopUser = false;
  let batchIndex = 0;

  console.info(
    `Fetching retweeters for tweet ${tweetId} until user ${stopAtUserId ?? 'none'}`
  );

  while (hasMore && users.length < maxUsers && !foundStopUser) {
    console.info(
      `Fetching retweeters batch ${batchIndex + 1}, current count=${users.length}`
    );
    const response = await client.twitter.tweets.getRetweeters(tweetId, {
      cursor
    });
    batchIndex++;

    const batch = response.data || [];
    console.info(
      `Fetched retweeters batch ${batchIndex}, found=${batch.length}`
    );

    if (stopAtUserId) {
      const stopIndex = batch.findIndex(
        (user: User) => user.id === stopAtUserId
      );
      if (stopIndex !== -1) {
        users.push(...batch.slice(0, stopIndex));
        foundStopUser = true;
        console.info(
          `Found stop user ${stopAtUserId} at index ${stopIndex}, collected ${users.length} new users`
        );
        break;
      }
    }

    users.push(...batch);

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

  console.info(
    `Finished fetching retweeters, total count=${users.length}, foundStopUser=${foundStopUser}`
  );
  return {
    users: compact(users),
    nextCursor: foundStopUser ? undefined : cursor,
    hasMore: hasMore && !foundStopUser
  };
};
