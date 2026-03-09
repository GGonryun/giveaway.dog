import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTweetCached } from '@/lib/scrapebadger/procedures/get-tweet-cached';
import { getUserCached } from '@/lib/scrapebadger/procedures/get-user-cached';
import {
  calculateApiCalls,
  estimateDuration
} from '@/lib/pickers/x/utils/calculate-api-calls';
import type { Tweet } from 'scrapebadger';
import { auth } from '@/lib/auth/config';
import { ApplicationError } from '@/lib/errors';
import { checkAndConsumeCredits } from '@/lib/scrapebadger/credits';
import { CREDIT_COSTS } from '@/lib/scrapebadger/settings';

const loadTweetSchema = z.object({
  postUrl: z
    .string()
    .url('Please enter a valid URL')
    .refine(
      (url) =>
        url.includes('twitter.com') ||
        url.includes('x.com') ||
        url.includes('t.co'),
      {
        message: 'Please enter a valid X (Twitter) post URL'
      }
    )
});

function extractTweetId(url: string): string | null {
  const patterns = [
    /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
    /t\.co\/(\w+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id || null;

  try {
    const body = await request.json();
    const parseResult = loadTweetSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.errors[0]?.message || 'Invalid request'
        },
        { status: 400 }
      );
    }

    const { postUrl } = parseResult.data;

    const tweetId = extractTweetId(postUrl);
    if (!tweetId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not extract tweet ID from URL'
        },
        { status: 400 }
      );
    }

    // Charge credits upfront for this endpoint call
    await checkAndConsumeCredits(userId, CREDIT_COSTS.LOAD_TWEET_ENDPOINT);

    const tweet = await getTweetCached({ tweetId, userId });
    const user = await getUserCached({ username: tweet.username, userId });

    const profileImageUrl = user.profile_image_url ?? null;
    const isBlueVerified = user.is_blue_verified ?? false;

    const retweetCount = Number(tweet.retweet_count) || 0;
    const apiCalls = calculateApiCalls(retweetCount);
    const estimatedDurationMs = estimateDuration(apiCalls);

    const tweetData = {
      id: tweet.id,
      text: tweet.text,
      username: tweet.username ?? tweet.user_name ?? null,
      profileImageUrl,
      favoriteCount: Number(tweet.favorite_count) ?? null,
      retweetCount,
      replyCount: Number(tweet.reply_count) ?? null,
      viewCount: Number(tweet.view_count) ?? null,
      quoteCount: Number(tweet.quote_count) ?? null,
      createdAt: tweet.created_at
        ? new Date(tweet.created_at).toISOString()
        : new Date().toISOString(),
      isBlueVerified,
      userId: tweet.user_id ?? null,
      media: (
        tweet.media?.filter(
          (m: Tweet['media'][number]) => m.type === 'photo'
        ) ?? []
      ).map((m: Tweet['media'][number]) => ({
        url: m.url!,
        width: m.width!,
        height: m.height!,
        altText: m.alt_text ?? null
      })),
      estimatedDurationMs
    };

    return NextResponse.json({
      success: true,
      data: tweetData
    });
  } catch (error) {
    console.error('[load-tweet] Error loading tweet:', error);

    return ApplicationError.toNextResponse(error);
  }
}
