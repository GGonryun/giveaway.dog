import prisma from '@/lib/prisma';
import { getRetweeters } from '@/lib/scrapebadger/procedures/get-retweeters';
import { FatalError } from 'workflow';
import { toTwitterPickerUsers } from '../shared';

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
    const retweeters = await getRetweeters({
      tweetId,
      cursor
    });

    await prisma.twitterPickerUser.createMany({
      data: toTwitterPickerUsers({
        pickerId,
        users: retweeters.data
      }),
      skipDuplicates: true
    });

    return retweeters;
  } catch (error) {
    console.error('Error storing retweeters:', error);
    throw new FatalError(
      `Failed to store retweeters for tweetId ${tweetId}: ${error}`
    );
  }
}
