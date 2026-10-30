import 'server-only';

import prisma from '@giveaway/db-client/prisma';
import {
  getRetweeters,
  getRetweetersUntil
} from '@giveaway/x-scraper/procedures/get-retweeters';
import { toTwitterPickerUsers } from '../shared';
import { toStepError } from '../errors';

export async function storeRetweeters({
  tweetId,
  pickerId,
  cursor
}: {
  tweetId: string;
  pickerId: string;
  cursor: string | undefined;
}) {
  'use step';

  try {
    const retweeters = await getRetweetersUntil({
      tweetId,
      cursor,
      maxApiCalls: 5
    });

    await prisma.twitterPickerUser.createMany({
      data: toTwitterPickerUsers({
        pickerId,
        users: retweeters.users
      }),
      skipDuplicates: true
    });

    return retweeters;
  } catch (error) {
    console.error('Error storing retweeters:', error);
    throw toStepError(
      error,
      `Failed to store retweeters for tweetId ${tweetId}`
    );
  }
}
