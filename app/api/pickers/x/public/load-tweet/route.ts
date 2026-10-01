import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTweetCached } from '@/lib/scrapebadger/procedures/get-tweet-cached';
import { getUserCached } from '@/lib/scrapebadger/procedures/get-user-cached';
import {
  calculateApiCalls,
  estimateDuration
} from '@/lib/pickers/x/utils/calculate-api-calls';
import type { Tweet } from 'scrapebadger';
import { ApplicationError } from '@/lib/errors';
import { checkAndConsumeCredits } from '@/lib/scrapebadger/credits';
import { CREDIT_COSTS } from '@/lib/scrapebadger/settings';
import prisma from '@/lib/prisma';
import {
  X_PICKER_LIKES_KEY,
  X_PICKER_RETWEETS_KEY,
  X_PICKER_REPLIES_KEY,
  X_PICKER_QUOTES_KEY
} from '@/lib/pickers/x/constants';

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
    await checkAndConsumeCredits(
      request.headers,
      CREDIT_COSTS.LOAD_TWEET_ENDPOINT
    );

    const tweet = await getTweetCached({ tweetId });
    const user = await getUserCached({ username: tweet.username });

    const profileImageUrl = user.profile_image_url ?? null;
    const isBlueVerified = user.is_blue_verified ?? false;

    const retweetCount = Number(tweet.retweet_count) || 0;
    const likeCount = Number(tweet.favorite_count) || 0;
    const replyCount = Number(tweet.reply_count) || 0;
    const quoteCount = Number(tweet.quote_count) || 0;
    const apiCalls = calculateApiCalls(retweetCount);
    const estimatedDurationMs = estimateDuration(apiCalls);

    const tweetData = {
      id: tweet.id,
      text: tweet.text,
      username: tweet.username ?? tweet.user_name ?? null,
      profileImageUrl,
      favoriteCount: likeCount,
      retweetCount,
      replyCount,
      viewCount: Number(tweet.view_count) ?? null,
      quoteCount,
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

    prisma
      .$transaction([
        prisma.siteMetric.upsert({
          where: { key: X_PICKER_LIKES_KEY },
          create: { key: X_PICKER_LIKES_KEY, value: likeCount },
          update: { value: { increment: likeCount } }
        }),
        prisma.siteMetric.upsert({
          where: { key: X_PICKER_RETWEETS_KEY },
          create: { key: X_PICKER_RETWEETS_KEY, value: retweetCount },
          update: { value: { increment: retweetCount } }
        }),
        prisma.siteMetric.upsert({
          where: { key: X_PICKER_REPLIES_KEY },
          create: { key: X_PICKER_REPLIES_KEY, value: replyCount },
          update: { value: { increment: replyCount } }
        }),
        prisma.siteMetric.upsert({
          where: { key: X_PICKER_QUOTES_KEY },
          create: { key: X_PICKER_QUOTES_KEY, value: quoteCount },
          update: { value: { increment: quoteCount } }
        })
      ])
      .catch(() => {});

    return NextResponse.json({
      success: true,
      data: tweetData
    });
  } catch (error) {
    console.error('[load-tweet] Error loading tweet:', error);

    return ApplicationError.toNextResponse(error);
  }
}
