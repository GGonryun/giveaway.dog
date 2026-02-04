import { sleep } from 'workflow';
import { finalizeProgress } from './steps/finalize-progress';
import { storeRetweeters } from './steps/store-retweeters';
import { storeTweetData } from './steps/store-tweet-data';
import { updatePickerStatus } from './steps/update-picker-status';
import { writeProgress } from './steps/write-progress';

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

  let retweets = 0;
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

    retweets = tweets.reduce(
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
  } finally {
    await finalizeProgress(retweets);
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
    console.log(
      `Scraped ${retweeters.data.length} retweeters for tweet ${tweetId}`
    );
    current += retweeters.data.length;
    hasMore = retweeters.hasMore;
    cursor = retweeters.nextCursor;
    console.log(`Resulting cursor: ${cursor}, hasMore: ${hasMore}`);
    await writeProgress({ max, current, status: 'PROCESSING' });
    console.log(`Progress: ${current}/${max}`);
  }

  return current;
}
