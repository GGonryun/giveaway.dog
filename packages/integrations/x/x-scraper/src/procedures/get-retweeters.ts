import 'server-only';

import { parseProviderResponse } from '@giveaway/integration-server/provider-response';
import { getScrapeBadgerClient } from '../client';
import {
  scrapeBadgerUserPageSchema,
  type ScrapeBadgerUser,
  type ScrapeBadgerUserPage
} from '../schemas';

const DEFAULT_MAX_API_CALLS = 10;
const DEFAULT_MAX_USERS = 500;

const getRetweetersPage = async (
  client: ReturnType<typeof getScrapeBadgerClient>,
  tweetId: string,
  options: { cursor?: string; count?: number }
): Promise<ScrapeBadgerUserPage> =>
  parseProviderResponse({
    provider: 'scrapebadger',
    call: 'tweets.getRetweeters',
    schema: scrapeBadgerUserPageSchema,
    data: await client.twitter.tweets.getRetweeters(tweetId, options)
  });

export const getRetweeters = async ({
  tweetId,
  cursor
}: {
  tweetId: string;
  cursor?: string;
}) => {
  return await getRetweetersPage(getScrapeBadgerClient(), tweetId, {
    cursor
  });
};

export const getRetweetersUntil = async ({
  tweetId,
  cursor: startCursor,
  maxApiCalls = DEFAULT_MAX_API_CALLS
}: {
  tweetId: string;
  cursor?: string;
  maxApiCalls?: number;
}): Promise<{
  users: ScrapeBadgerUser[];
  nextCursor?: string;
  hasMore: boolean;
}> => {
  const client = getScrapeBadgerClient();
  const users: ScrapeBadgerUser[] = [];
  let cursor: string | undefined = startCursor;
  let hasMore = true;
  let apiCallCount = 0;

  console.info(
    `Fetching retweeters for tweet ${tweetId} with maxApiCalls=${maxApiCalls}`
  );

  while (hasMore && apiCallCount < maxApiCalls) {
    console.info(
      `Fetching retweeters batch ${apiCallCount + 1}, current user count=${users.length}`
    );
    const response = await getRetweetersPage(client, tweetId, {
      cursor,
      count: 20
    });
    apiCallCount++;

    users.push(...response.data);

    hasMore = response.hasMore;
    cursor = response.nextCursor;

    console.info(
      `Fetched ${users.length} retweeters so far (${apiCallCount} API calls), hasMore=${hasMore}`
    );
    if (!hasMore || !cursor) {
      console.info('No more retweeters to fetch, exiting loop');
      break;
    }
  }

  console.info(
    `Finished fetching retweeters, total count=${users.length}, API calls=${apiCallCount}`
  );
  return {
    users,
    nextCursor: cursor,
    hasMore
  };
};

export const getRetweetersUntilUser = async ({
  tweetId,
  stopAtUserId,
  cursor: startCursor,
  maxUsers = DEFAULT_MAX_USERS
}: {
  tweetId: string;
  stopAtUserId?: string;
  cursor?: string;
  maxUsers?: number;
}): Promise<{
  users: ScrapeBadgerUser[];
  nextCursor?: string;
  hasMore: boolean;
}> => {
  const client = getScrapeBadgerClient();
  const users: ScrapeBadgerUser[] = [];
  let cursor: string | undefined = startCursor;
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
    const response = await getRetweetersPage(client, tweetId, {
      cursor
    });
    batchIndex++;

    const batch = response.data;
    console.info(
      `Fetched retweeters batch ${batchIndex}, found=${batch.length}`
    );

    if (stopAtUserId) {
      const stopIndex = batch.findIndex((user) => user.id === stopAtUserId);
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

    hasMore = response.hasMore;
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
    users,
    nextCursor: foundStopUser ? undefined : cursor,
    hasMore: hasMore && !foundStopUser
  };
};

export const getAllRetweeters = async ({
  tweetId
}: {
  tweetId: string;
}): Promise<ScrapeBadgerUser[]> => {
  const client = getScrapeBadgerClient();
  const users: ScrapeBadgerUser[] = [];
  let cursor: string | undefined;
  let hasMore = true;
  let batchIndex = 0;

  console.info(`[getAllRetweeters] Starting fetch for tweet ${tweetId}`);

  while (hasMore) {
    const response = await getRetweetersPage(client, tweetId, {
      cursor
    });
    batchIndex++;

    const batch = response.data;
    users.push(...batch);

    console.info(
      `[getAllRetweeters] Batch ${batchIndex}: fetched ${batch.length} users (total: ${users.length})`
    );

    hasMore = response.hasMore;
    cursor = response.nextCursor;

    if (!hasMore || !cursor) {
      console.info('[getAllRetweeters] No more retweeters to fetch');
      break;
    }
  }

  console.info(
    `[getAllRetweeters] Completed: ${users.length} total retweeters for tweet ${tweetId}`
  );

  return users;
};
