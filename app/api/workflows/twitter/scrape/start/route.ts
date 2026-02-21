import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { isValidCronSecret } from '@/lib/jobs/util';
import { PickerStatus } from '@prisma/client';
import { start } from 'workflow/api';
import { twitterScrapeRequest } from '@/lib/pickers/x/schemas/workflow';
import { scrapeTwitterWorkflow } from '@/lib/pickers/x/workflows/scrape-twitter/workflow';
import { extractTweetId } from '@/lib/integrations/schemas/twitter';
import { getWorld } from 'workflow/runtime';

export async function POST(request: NextRequest) {
  if (!isValidCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = twitterScrapeRequest.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { pickerId, data } = parsed.data;

  const picker = await prisma.twitterPicker.findUnique({
    where: { id: pickerId }
  });

  if (!picker) {
    return NextResponse.json({ error: 'Picker not found' }, { status: 404 });
  }

  if (picker.runId) {
    await safeWorldCancel(picker.runId);
    await safeCleanUp(picker.id);
  }

  const tweetUrls = data.setup.postUrls.map((item) => item.url);

  const runDate = data.timing?.runAt ? new Date(data.timing.runAt) : undefined;

  const result = await start(scrapeTwitterWorkflow, [
    {
      tweetIds: tweetUrls.map((t) => extractTweetId(t)),
      pickerId,
      runDate
    }
  ]);

  await prisma.twitterPicker.update({
    where: { id: pickerId },
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
      runAt: data.timing?.runAt ? new Date(data.timing.runAt) : null
    }
  });

  return NextResponse.json({ success: true });
}

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

const safeCleanUp = async (pickerId: string) => {
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
