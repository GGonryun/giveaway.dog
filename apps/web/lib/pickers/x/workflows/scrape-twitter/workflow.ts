import { sleep } from 'workflow';
import { storeRetweeters } from './steps/store-retweeters';
import { storeTweetData } from './steps/store-tweet-data';
import { updatePickerStatus } from './steps/update-picker-status';

export async function scrapeTwitterWorkflow({
  tweetIds,
  pickerId,
  runDate
}: {
  tweetIds: string[];
  pickerId: string;
  runDate?: Date;
}) {
  'use workflow';

  try {
    if (runDate) {
      await updatePickerStatus({ pickerId, status: 'SCHEDULED' });
      await sleep(runDate);
    } else {
      await updatePickerStatus({ pickerId, status: 'PROCESSING' });
    }

    const tweets = await Promise.all(
      tweetIds.map((tweetId) => storeTweetData({ tweetId, pickerId }))
    );

    const retweets = tweets.reduce(
      (acc, tweet) => acc + (tweet.retweetCount || 0),
      0
    );

    let progress = 0;
    for (const tweet of tweets) {
      progress += await scrapeTwitterReposts({
        tweetId: tweet.tweetId,
        pickerId,
        max: retweets,
        current: progress
      });
    }

    await updatePickerStatus({ pickerId, status: 'COMPLETE' });
  } catch (error) {
    await updatePickerStatus({ pickerId, status: 'FAILED' });
  }
}

async function scrapeTwitterReposts({
  tweetId,
  pickerId,
  max,
  current: defaultCurrent
}: {
  tweetId: string;
  pickerId: string;
  max: number;
  current: number;
}) {
  'use workflow';

  let cursor: string | undefined = undefined;
  let hasMore = true;
  let current = defaultCurrent;

  while (hasMore) {
    const retweeters = await storeRetweeters({
      tweetId,
      cursor,
      pickerId
    });
    console.info(
      `Scraped ${retweeters.users.length} retweeters for tweet ${tweetId}`
    );
    current += retweeters.users.length;
    hasMore = retweeters.hasMore;
    cursor = retweeters.nextCursor;
    console.info(`Resulting cursor: ${cursor}, hasMore: ${hasMore}`);
    console.info(`Progress: ${current}/${max}`);
  }

  return current;
}
