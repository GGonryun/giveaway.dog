import prisma from '@giveaway/db-client/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { isValidCronSecret } from '@giveaway/jobs/util';
import { startScrapeTwitter } from '@giveaway/x-picker-workflow/scrape-twitter/start';
import { twitterScrapeRequest } from '@giveaway/x-picker-model/schemas/workflow';

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

  await startScrapeTwitter({ picker, data });

  return NextResponse.json({ success: true });
}
