import 'server-only';

import prisma from '@giveaway/db-client/prisma';
import { start } from 'workflow/api';
import { getWorld } from 'workflow/runtime';
import { extractTweetId } from '@giveaway/x-model/twitter';
import { TwitterScrapeRequest } from '@giveaway/x-picker-model/schemas/workflow';
import { scrapeTwitterWorkflow } from './workflow';

const safeWorldCancel = async (runId: string) => {
  const world = getWorld();
  try {
    const run = await world.runs.get(runId);
    if (run.status === 'running' || run.status === 'pending') {
      await world.runs.cancel(runId);
    }
  } catch (error) {
    console.warn('Failed to cancel existing run:', error);
  }
};

const cleanUp = async (pickerId: string) => {
  await prisma.$transaction([
    prisma.twitterPickerUser.deleteMany({
      where: { pickerId }
    }),
    prisma.twitterPickerDraw.deleteMany({
      where: { pickerId }
    }),
    prisma.twitterPost.deleteMany({
      where: { pickerId }
    })
  ]);
};

export const startScrapeTwitter = async ({
  picker,
  data
}: {
  picker: { id: string; runId: string | null };
  data: TwitterScrapeRequest['data'];
}) => {
  if (picker.runId) {
    await safeWorldCancel(picker.runId);
    await cleanUp(picker.id);
  }

  const tweetUrls = data.setup.postUrls.map((item) => item.url);
  const runAt = data.timing?.runAt ? new Date(data.timing.runAt) : null;

  const result = await start(scrapeTwitterWorkflow, [
    {
      tweetIds: tweetUrls.map((url) => extractTweetId(url)),
      pickerId: picker.id,
      runDate: runAt ?? undefined
    }
  ]);

  await prisma.twitterPicker.update({
    where: { id: picker.id },
    data: {
      runId: result.runId,
      tweetUrls,
      winners: data.winners.quota,
      minPostCount: data.filters.minimumPostCount,
      minAccountAgeDays: data.filters.minimumAccountAgeDays,
      minFollowersCount: data.filters.minimumFollowers,
      minFollowingCount: data.filters.minimumFollowing,
      requireProfileImage: data.filters.hasProfileImage,
      requireBannerImage: data.filters.hasBanner,
      requireLocation: data.filters.hasLocation,
      requireBio: data.filters.hasDescription,
      lastPostWithin: data.filters.lastPostWithin,
      runAt
    }
  });

  return { runId: result.runId };
};
